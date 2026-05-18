# Spec: Auth Module — Register / Login / Forgot Password / Change Password

Status: **APPROVED — ready for Phase 2: Plan**
Owner: namno383@gmail.com
Last updated: 2026-05-18

---

## 1. Objective

Implement the authentication surface of the Instagram-clone backend. Four user-facing flows, all email-bound, with email-OTP verification on every flow except login.

| Flow | OTP? | Notes |
|---|---|---|
| Register | yes | Create `User` with `is_verified=false`, then verify via OTP. |
| Login | no | Email + password. Refuses unverified users. |
| Forgot password | yes | Two-step: verify OTP → consume one-time `reset_token` to set new password. |
| Change password (authenticated) | yes | Requires current password **and** OTP sent to the account email. |

**Why these flows:** Minimum auth surface that lets the rest of the modules (post, story, chat, …) assume an authenticated, email-verified `userId` in every request. Anything beyond — social login, 2FA, SMS recovery — is out of scope.

**Success looks like:**
- A new user can register, receive a 6-digit OTP, verify, and obtain a JWT access+refresh pair in ≤ 3 API calls.
- A user who forgot their password can reset it in ≤ 3 API calls without revealing whether the email exists.
- A signed-in user can change their password in ≤ 2 API calls (request-otp + confirm).
- All endpoints respond in < 500 ms p95 (excluding email send — `@Async`).

---

## 2. Tech Stack

- **Runtime:** Java 21, Spring Boot 3.3 (existing).
- **Persistence:** PostgreSQL via JPA/Hibernate (`validate` mode, Liquibase append-only).
- **Cache/ephemeral state:** Redis (`spring-boot-data-redis`) for OTPs, refresh-token whitelist, password-reset tokens, rate-limit locks.
- **Crypto:** `BCryptPasswordEncoder` (already wired in `SecurityConfig`).
- **JWT:** existing `JwtUtil` (`jjwt-api 0.x`), access 15 min, refresh 30 days, HS256.
- **Email:** `spring-boot-starter-mail` — wraps Jakarta Mail, auto-configures `JavaMailSender` bean từ `application.yml`. Không cần khai báo bean thủ công.
- **Validation:** `spring-boot-starter-validation` (Jakarta Bean Validation).
- **Docs:** Swagger UI via `springdoc-openapi-starter-webmvc-ui` (already on classpath).

### Dependency duy nhất cần thêm

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

### Email configuration

`application.yml` (placeholder only — không commit secret):

```yaml
spring:
  mail:
    host: ${MAIL_HOST:smtp.gmail.com}
    port: ${MAIL_PORT:587}
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
```

`.env` (git-ignored):
```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=yourname@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx   # Gmail App Password (16 chars)
```

**Đổi provider không cần đổi code — chỉ đổi config:**

| Environment | Host | Port | Ghi chú |
|---|---|---|---|
| Dev/prod (Gmail) | `smtp.gmail.com` | 587 | Cần bật 2FA + App Password |
| Prod (Resend) | `smtp.resend.com` | 587 | Free 3 000 email/tháng |
| Prod (SES) | `email-smtp.<region>.amazonaws.com` | 587 | IAM SMTP credentials |
| Prod (SendGrid) | `smtp.sendgrid.net` | 587 | `username=apikey` |

---

## 3. Commands

Run từ `instagram-clone/backend/`.

| Task | Command |
|---|---|
| Boot infra (Postgres, Redis, MinIO) | `docker-compose up -d` (từ `instagram-clone/`) |
| Build (skip tests) | `mvn clean package -DskipTests` |
| Run app (dev profile) | `mvn spring-boot:run` |
| All tests | `mvn test` |
| Auth tests only | `mvn test -Dtest='com.instagram.module.auth.**'` |
| Single test method | `mvn test -Dtest=AuthServiceTest#register_shouldCreateUnverifiedUser` |
| Apply migrations only | `mvn liquibase:update` |

---

## 4. Project Structure

```
src/main/java/com/instagram/module/auth/
├── controller/
│   ├── AuthController.java
│   ├── PasswordResetController.java
│   └── PasswordChangeController.java
├── dto/
│   ├── request/
│   │   ├── RegisterRequest.java
│   │   ├── VerifyEmailRequest.java
│   │   ├── ResendOtpRequest.java
│   │   ├── LoginRequest.java
│   │   ├── RefreshRequest.java
│   │   ├── ForgotPasswordRequest.java
│   │   ├── ForgotPasswordVerifyRequest.java
│   │   ├── ForgotPasswordResetRequest.java
│   │   └── ChangePasswordConfirmRequest.java
│   └── response/
│       ├── AuthTokens.java
│       ├── ResetTokenResponse.java
│       └── MessageResponse.java
├── service/
│   ├── AuthService.java
│   ├── OtpService.java               // interface
│   ├── RedisOtpService.java          // impl
│   ├── EmailService.java             // interface
│   ├── JavaMailEmailService.java     // impl — inject JavaMailSender
│   ├── RefreshTokenStore.java
│   └── PasswordResetTokenStore.java
├── entity/                           // (empty)
├── event/
│   ├── UserRegisteredEvent.java
│   ├── EmailVerifiedEvent.java
│   └── PasswordChangedEvent.java
└── exception/
    ├── InvalidCredentialsException.java
    ├── EmailNotVerifiedException.java
    ├── OtpInvalidException.java
    ├── OtpExpiredException.java
    ├── OtpThrottledException.java
    └── ResetTokenInvalidException.java
```

`module/user/service/` thêm:

```
├── UserCommandService.java       // NEW interface
└── UserCommandServiceImpl.java   // NEW impl
```

```java
public interface UserCommandService {
    UserSummary createUnverifiedUser(CreateUserCommand cmd);
    void markEmailVerified(UUID userId);
    void updatePasswordHash(UUID userId, String newHash);
    Optional<UserAuthView> findAuthViewByEmail(String email);
}
```

`UserAuthView` là DTO mới tại `module/user/dto/response/` — cách duy nhất auth đọc `passwordHash`, không bao giờ import `User` entity hay `UserRepository` trực tiếp.

### JavaMailEmailService

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class JavaMailEmailService implements EmailService {

    private final JavaMailSender mailSender;  // auto-configured bởi spring-boot-starter-mail

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Async
    @Override
    public void sendOtp(String to, String purpose, String otp) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromAddress);
        msg.setTo(to);
        msg.setSubject("Your OTP Code");
        msg.setText("Your " + purpose + " OTP: " + otp + "\nExpires in 5 minutes.");
        mailSender.send(msg);
        log.info("OTP email sent purpose={} to={}", purpose, to); // không log OTP
    }
}
```

---

## 5. Code Style

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.accepted().body(MessageResponse.of("OTP sent to email"));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthTokens> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }
}
```

Conventions:
- Records cho tất cả DTOs.
- Static factory `from(...)` trên response records.
- Service methods package-private; chỉ interface methods là public.
- Bean Validation trên mọi DTO field — không check null thủ công trong service.
- Mọi custom exception extend `BusinessException` (`core/exception/`) — không `try/catch` trong controller.
- Constructor injection only (`@RequiredArgsConstructor`) — không `@Autowired` field.
- `@Slf4j`. **Không bao giờ** log OTP, password, refresh token, reset token.

---

## 6. Cross-Module Boundary

| Concern | Owner | Mechanism |
|---|---|---|
| `User` entity, `users` table | `module/user` | — |
| Read user for login | `module/auth` → `module/user` | `UserCommandService.findAuthViewByEmail` (DTO `UserAuthView`) |
| Create unverified user | `module/auth` → `module/user` | `UserCommandService.createUnverifiedUser` |
| Mark email verified | `module/auth` → `module/user` | `UserCommandService.markEmailVerified` |
| Update password hash | `module/auth` → `module/user` | `UserCommandService.updatePasswordHash` |
| Notify on events | `module/auth` publishes | Spring `ApplicationEventPublisher` |

---

## 7. API Surface

### 7.1 Register

`POST /api/auth/register`
```json
{ "email": "a@b.com", "username": "alice", "password": "P@ssw0rd!", "displayName": "Alice" }
```
- Validations: email RFC, username `^[a-z0-9_.]{3,30}$`, password ≥ 8 chars (1 letter + 1 digit), displayName ≤ 60.
- email/username tồn tại → `409 CONFLICT`. Còn lại: tạo `User` với `is_verified=false`, hash password, tạo OTP, lưu Redis, gửi email async.
- Response: `202 ACCEPTED` `{ "message": "OTP sent to email" }`.

`POST /api/auth/register/resend-otp`
```json
{ "email": "a@b.com" }
```
- 60s rate-limit per email (Redis lock `otp:resend-lock:REGISTER:{email}`).
- Luôn trả `202` dù email có tồn tại hay không (anti-enumeration).

`POST /api/auth/register/verify-email`
```json
{ "email": "a@b.com", "otp": "123456" }
```
- Verify OTP → set `is_verified=true` → publish `EmailVerifiedEvent` → trả `AuthTokens` (auto-login).
- Errors: `400 OTP_INVALID` / `OTP_EXPIRED` / `OTP_TOO_MANY_ATTEMPTS`.

### 7.2 Login

`POST /api/auth/login`
```json
{ "email": "a@b.com", "password": "P@ssw0rd!" }
```
- User không tồn tại hoặc sai password → `401 INVALID_CREDENTIALS` (cùng một code, không phân biệt — anti-enumeration).
- User tồn tại nhưng `is_verified=false` → `403 EMAIL_NOT_VERIFIED` (FE dùng để hiện nút "Resend OTP").
- Response: `AuthTokens { accessToken, refreshToken, tokenType: "Bearer", expiresIn: 900 }`. `jti` của refreshToken được whitelist trong Redis `refresh-token:{jti}` → `userId`, TTL 30 days.

### 7.3 Refresh

`POST /api/auth/refresh`
```json
{ "refreshToken": "..." }
```
- Validate signature + expiry + Redis whitelist.
- Rotate: xóa jti cũ, issue access+refresh mới với jti mới.
- Errors: `401 REFRESH_TOKEN_INVALID`.

### 7.4 Logout

`POST /api/auth/logout` (Authorization header required)
- Xóa jti của refresh token khỏi Redis whitelist.
- Body: `{ "refreshToken": "..." }`.
- Response: `204 NO_CONTENT`.

### 7.5 Forgot password

`POST /api/auth/forgot-password/request-otp`
```json
{ "email": "a@b.com" }
```
- Tạo OTP, gửi email **chỉ khi** email tồn tại. Luôn trả `202` (anti-enumeration). 60s resend lock.

`POST /api/auth/forgot-password/verify-otp`
```json
{ "email": "a@b.com", "otp": "123456" }
```
- Thành công: tạo `reset_token` (UUID 32-byte base64url), lưu `pwd-reset:{token}` → `userId` với TTL 10 phút.
- Response: `200` `{ "resetToken": "...", "expiresIn": 600 }`.

`POST /api/auth/forgot-password/reset`
```json
{ "resetToken": "...", "newPassword": "N3wP@ssword" }
```
- Consume reset-token (atomic `GETDEL`), update password hash, **invalidate tất cả refresh token của user** (dùng Redis set `user-refresh-tokens:{userId}`).
- Publish `PasswordChangedEvent`.
- Errors: `400 RESET_TOKEN_INVALID`.

### 7.6 Change password (authenticated)

`POST /api/auth/change-password/request-otp` (auth required, no body)
- Gửi OTP đến email của user đang đăng nhập. 60s resend lock theo `userId`.

`POST /api/auth/change-password/confirm` (auth required)
```json
{ "oldPassword": "P@ssw0rd!", "otp": "123456", "newPassword": "N3wP@ssword" }
```
- Verify `oldPassword` **và** OTP — cả hai phải đúng.
- Update hash, invalidate tất cả refresh token của user (client phải re-login). Publish `PasswordChangedEvent`.
- Errors: `400 INVALID_OLD_PASSWORD` / `OTP_INVALID` / `OTP_EXPIRED`.

---

## 8. Redis Key Catalogue

| Key | Type | TTL | Purpose |
|---|---|---|---|
| `otp:REGISTER:{email}` | hash `{hash, attempts, createdAt}` | 5 min | Register OTP (BCrypt-hashed; max 5 sai → xóa key) |
| `otp:FORGOT:{email}` | hash | 5 min | Forgot-password OTP |
| `otp:CHANGE:{userId}` | hash | 5 min | Change-password OTP |
| `otp:resend-lock:{purpose}:{key}` | string `"1"` | 60 s | Resend rate-limit |
| `pwd-reset:{token}` | string `userId` | 10 min | One-time reset token (atomic `GETDEL`) |
| `refresh-token:{jti}` | string `userId` | 30 days | Refresh-token whitelist |
| `user-refresh-tokens:{userId}` | set of `jti` | — | Reverse index cho "invalidate all" |

Không có SQL table mới. `User` đã có `email`, `password_hash`, `is_verified`.

---

## 9. Testing Strategy

| Level | Framework | Where | What |
|---|---|---|---|
| Unit | JUnit 5 + Mockito | `.../module/auth/service/` | `AuthService`, `OtpService`, `PasswordResetTokenStore` với mocked dependencies. Không load Spring context. |
| Slice | `@WebMvcTest` | `.../module/auth/controller/` | Validation, request/response shape, status codes. Service layer mocked. |
| Integration | `@DataJpaTest` + Testcontainers Postgres | `.../module/user/repository/` | `UserCommandServiceImpl` against real DB. |
| E2E | `@SpringBootTest(RANDOM_PORT)` + Testcontainers Postgres + Redis + real SMTP | `src/test/java/.../e2e/AuthFlowE2E.java` | Full flow: register → verify → login → change-password → forgot-password. |

**E2E email strategy:** dùng `spring-boot-starter-mail` trỏ vào SMTP thật (Gmail hoặc Mailtrap sandbox) — email gửi thật, test đọc từ inbox qua API (Mailtrap) hoặc kiểm tra delivery log. OTP được đọc từ Redis trực tiếp trong test để assert, không parse email body.

Coverage target: `module/auth/service/` ≥ 85% line, ≥ 80% branch.

---

## 10. Boundaries

**Always do**
- Hash OTP trước khi lưu Redis (BCrypt, nhất quán với password).
- Dùng `SecureRandom` cho OTP và reset-token.
- Log event name + email; redact OTP, token, password.
- Chạy `mvn test` trước mọi commit auth.
- Thêm Liquibase changeset cho mọi column mới — không edit changeset đã apply.
- Trả `202 ACCEPTED` (không phải `404`) cho forgot-password và resend-OTP với email không tồn tại.
- Gửi email `@Async` — không bao giờ gửi synchronous trong request handler.

**Ask first**
- Thêm dependency nào ngoài `spring-boot-starter-mail`.
- Thêm column mới vào bảng `users`.
- Thay đổi JWT signing algorithm hoặc token lifetime.
- Thêm sliding-window rate limiter phức tạp hơn Redis resend lock hiện tại.

**Never**
- Import `User` entity hoặc `UserRepository` từ `module/auth`.
- Lưu OTP hoặc reset token trong Postgres.
- Trả status/code khác nhau cho "email không tồn tại" vs "OTP request OK" trên forgot-password và resend.
- Log raw password, OTP, refresh token, reset token.
- Commit SMTP credentials — chỉ dùng env var placeholder trong `application.yml`.

---

## 11. Decisions Locked

| # | Quyết định |
|---|---|
| Email library | `spring-boot-starter-mail` (Jakarta Mail), auto-configured `JavaMailSender` |
| Email dev/prod | Gmail SMTP hoặc bất kỳ SMTP provider — chỉ đổi `application.yml`, không đổi code |
| `last_password_change_at` | Thêm ngay — 1 Liquibase changeset |
| Login lockout | Defer — xử lý ở gateway sau |
| Unverified login response | Giữ `403 EMAIL_NOT_VERIFIED` — FE cần để hiện nút resend |
| Register flow | Tạo user `is_verified=false` trước, verify OTP sau |
| Forgot password | Two-step: verify OTP → nhận `reset_token` → `/reset` consume token |
| Change password | Yêu cầu cả OTP lẫn old password |
| Login identifier | Email only |

---

## 12. Success Criteria

- [ ] `mvn test` xanh, tất cả auth test pass, không có test cũ nào bị regress.
- [ ] Manual smoke qua Swagger UI: register → nhận OTP email thật → verify → login → refresh → logout, tất cả trả đúng status code.
- [ ] `forgot-password` với email không tồn tại trả `202` và không gửi email.
- [ ] Change-password yêu cầu cả `oldPassword` lẫn OTP; sai `oldPassword` trả `400 INVALID_OLD_PASSWORD` dù OTP đúng.
- [ ] Sau khi đổi mật khẩu thành công, refresh token cũ trả `401` khi gọi `/refresh`.
- [ ] Không có log line nào chứa raw OTP, password, hoặc reset token.
- [ ] Không file nào trong `module/auth/` import từ `module/user/entity/**` hoặc `module/user/repository/**`.