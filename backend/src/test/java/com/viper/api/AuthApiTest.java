package com.viper.api;

import com.viper.module.auth.service.EmailService;
import com.viper.module.auth.service.OtpPurpose;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(AuthApiTest.StubEmailConfig.class)
@Testcontainers
@DisplayName("Auth API E2E — Postgres + Redis thật (Testcontainers), email mocked")
class AuthApiTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("viper_e2e")
            .withUsername("test")
            .withPassword("test");

    @Container
    static final GenericContainer<?> REDIS = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void containerProps(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        r.add("spring.datasource.username", POSTGRES::getUsername);
        r.add("spring.datasource.password", POSTGRES::getPassword);
        r.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");

        r.add("spring.data.redis.host", REDIS::getHost);
        r.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));

        r.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        r.add("spring.liquibase.enabled", () -> "true");
        r.add("spring.profiles.active", () -> "test");

        r.add("app.jwt.secret", () -> "test-jwt-secret-must-be-at-least-256-bits-long-for-hs256-signing");
        r.add("app.jwt.access-token-expiry-ms", () -> "900000");
        r.add("app.jwt.refresh-token-expiry-ms", () -> "2592000000");
        r.add("app.cors.allowed-origins", () -> "http://localhost:5173");
    }

    @TestConfiguration
    static class StubEmailConfig {
        @Bean
        @Primary
        EmailService stubEmailService() {
            return (to, purpose, otp) -> { /* no-op: OTP read from Redis in tests */ };
        }
    }

    @LocalServerPort int port;

    @Autowired StringRedisTemplate redis;

    @BeforeAll
    static void configureRestAssured() {
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
    }

    @BeforeEach
    void perTestSetup() {
        RestAssured.port = port;
        RestAssured.baseURI = "http://localhost";
        // Đảm bảo OTP / refresh-token Redis trống giữa các test
        var keys = redis.keys("otp:*");
        if (keys != null && !keys.isEmpty()) redis.delete(keys);
        var rkeys = redis.keys("refresh-token:*");
        if (rkeys != null && !rkeys.isEmpty()) redis.delete(rkeys);
        var ukeys = redis.keys("user-refresh-tokens:*");
        if (ukeys != null && !ukeys.isEmpty()) redis.delete(ukeys);
        var pkeys = redis.keys("pwd-reset:*");
        if (pkeys != null && !pkeys.isEmpty()) redis.delete(pkeys);
        var lkeys = redis.keys("otp:resend-lock:*");
        if (lkeys != null && !lkeys.isEmpty()) redis.delete(lkeys);
    }

    // ───────────────────────── helpers ─────────────────────────

    private void registerOk(String email, String username, String password) {
        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("username", username);
        body.put("password", password);
        body.put("displayName", username);
        given().contentType(ContentType.JSON).body(body)
                .when().post("/api/auth/register")
                .then().statusCode(202);
    }

    /**
     * E2E reads OTP from Redis (per spec §9). We never parse email bodies. Since OTP in Redis
     * is BCrypt-hashed (cannot be reversed), we generate a fresh OTP via the same OtpService
     * isn't possible — instead, we expose a controlled value by inserting our own.
     */
    private String readOtpFromRedisOrSeed(OtpPurpose purpose, String subject, String controlled) {
        String key = "otp:" + purpose.name() + ":" + subject;
        String existingHash = (String) redis.opsForHash().get(key, "hash");
        if (existingHash == null) {
            return null;
        }
        // The service stores a BCrypt hash; we cannot recover the raw OTP. Instead, overwrite
        // with a hash for our controlled value so we can call /verify with it.
        redis.opsForHash().put(key,
                "hash",
                new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(controlled));
        redis.opsForHash().put(key, "attempts", "0");
        return controlled;
    }

    // ───────────────────────── tests ─────────────────────────

    @Test
    @DisplayName("Happy path: register → verify → login → refresh → logout")
    void register_verify_login_refresh_logout_shouldAllSucceed() {
        String email = "happy@example.com";
        String username = "happy";
        String password = "P@ssw0rd!";

        registerOk(email, username, password);
        String otp = readOtpFromRedisOrSeed(OtpPurpose.REGISTER, email, "123456");

        // verify-email → 200 + tokens (auto-login)
        var verifyResp = given().contentType(ContentType.JSON)
                .body(Map.of("email", email, "otp", otp))
                .when().post("/api/auth/register/verify-email")
                .then().statusCode(200)
                .body("accessToken", notNullValue())
                .body("refreshToken", notNullValue())
                .body("tokenType", equalTo("Bearer"))
                .body("expiresIn", equalTo(900))
                .extract().jsonPath();

        // login again with credentials
        var loginResp = given().contentType(ContentType.JSON)
                .body(Map.of("email", email, "password", password))
                .when().post("/api/auth/login")
                .then().statusCode(200)
                .body("accessToken", notNullValue())
                .body("refreshToken", notNullValue())
                .extract().jsonPath();

        String refresh1 = loginResp.getString("refreshToken");

        // refresh → mới token, jti cũ revoke
        var refreshResp = given().contentType(ContentType.JSON)
                .body(Map.of("refreshToken", refresh1))
                .when().post("/api/auth/refresh")
                .then().statusCode(200)
                .body("accessToken", notNullValue())
                .body("refreshToken", notNullValue())
                .extract().jsonPath();

        String refresh2 = refreshResp.getString("refreshToken");

        // refresh token cũ giờ không còn whitelisted → 401
        given().contentType(ContentType.JSON)
                .body(Map.of("refreshToken", refresh1))
                .when().post("/api/auth/refresh")
                .then().statusCode(401)
                .body("code", equalTo("REFRESH_TOKEN_INVALID"));

        // logout với refresh hiện tại → 204
        given().contentType(ContentType.JSON)
                .body(Map.of("refreshToken", refresh2))
                .when().post("/api/auth/logout")
                .then().statusCode(204);

        // sau logout, refresh token đã bị revoke → 401
        given().contentType(ContentType.JSON)
                .body(Map.of("refreshToken", refresh2))
                .when().post("/api/auth/refresh")
                .then().statusCode(401);
    }

    @Test
    @DisplayName("register: email/username trùng → 409 EMAIL_OR_USERNAME_TAKEN")
    void register_shouldRejectDuplicateEmail() {
        registerOk("dup@example.com", "dup1", "P@ssw0rd!");

        given().contentType(ContentType.JSON)
                .body(Map.of(
                        "email", "dup@example.com",
                        "username", "dup2",
                        "password", "P@ssw0rd!",
                        "displayName", "dup"))
                .when().post("/api/auth/register")
                .then().statusCode(409)
                .body("code", equalTo("EMAIL_OR_USERNAME_TAKEN"));
    }

    @Test
    @DisplayName("login: chưa verify email → 403 EMAIL_NOT_VERIFIED")
    void login_shouldRejectUnverified() {
        registerOk("unv@example.com", "unv", "P@ssw0rd!");

        given().contentType(ContentType.JSON)
                .body(Map.of("email", "unv@example.com", "password", "P@ssw0rd!"))
                .when().post("/api/auth/login")
                .then().statusCode(403)
                .body("code", equalTo("EMAIL_NOT_VERIFIED"));
    }

    @Test
    @DisplayName("login: sai password → 401 INVALID_CREDENTIALS")
    void login_shouldRejectWrongPassword() {
        registerOk("wp@example.com", "wpuser", "P@ssw0rd!");
        String otp = readOtpFromRedisOrSeed(OtpPurpose.REGISTER, "wp@example.com", "123456");
        given().contentType(ContentType.JSON)
                .body(Map.of("email", "wp@example.com", "otp", otp))
                .when().post("/api/auth/register/verify-email").then().statusCode(200);

        given().contentType(ContentType.JSON)
                .body(Map.of("email", "wp@example.com", "password", "wrong-password"))
                .when().post("/api/auth/login")
                .then().statusCode(401)
                .body("code", equalTo("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("forgot-password: email không tồn tại → 202 (anti-enumeration), không gửi email")
    void forgotPassword_shouldReturn202ForUnknownEmail() {
        given().contentType(ContentType.JSON)
                .body(Map.of("email", "ghost@example.com"))
                .when().post("/api/auth/forgot-password/request-otp")
                .then().statusCode(202);
    }

    @Test
    @DisplayName("forgot-password full flow: request → verify → reset → refresh token cũ bị revoke")
    void forgotPassword_fullFlow_shouldRevokeAllSessions() {
        String email = "fp@example.com";
        registerOk(email, "fpuser", "P@ssw0rd!");
        readOtpFromRedisOrSeed(OtpPurpose.REGISTER, email, "111111");
        var tokens = given().contentType(ContentType.JSON)
                .body(Map.of("email", email, "otp", "111111"))
                .when().post("/api/auth/register/verify-email")
                .then().statusCode(200).extract().jsonPath();
        String oldRefresh = tokens.getString("refreshToken");

        given().contentType(ContentType.JSON).body(Map.of("email", email))
                .when().post("/api/auth/forgot-password/request-otp")
                .then().statusCode(202);
        readOtpFromRedisOrSeed(OtpPurpose.FORGOT, email, "654321");

        var verify = given().contentType(ContentType.JSON)
                .body(Map.of("email", email, "otp", "654321"))
                .when().post("/api/auth/forgot-password/verify-otp")
                .then().statusCode(200)
                .body("resetToken", notNullValue())
                .body("expiresIn", equalTo(600))
                .extract().jsonPath();

        String resetToken = verify.getString("resetToken");

        given().contentType(ContentType.JSON)
                .body(Map.of("resetToken", resetToken, "newPassword", "N3wP@ss!"))
                .when().post("/api/auth/forgot-password/reset")
                .then().statusCode(200);

        // Refresh token cũ bị invalidate sau reset
        given().contentType(ContentType.JSON)
                .body(Map.of("refreshToken", oldRefresh))
                .when().post("/api/auth/refresh")
                .then().statusCode(401);

        // Mật khẩu mới đăng nhập được
        given().contentType(ContentType.JSON)
                .body(Map.of("email", email, "password", "N3wP@ss!"))
                .when().post("/api/auth/login")
                .then().statusCode(200);
    }

    @Test
    @DisplayName("forgot-password/reset: reset-token sai → 400 RESET_TOKEN_INVALID")
    void forgotPassword_shouldRejectBadResetToken() {
        given().contentType(ContentType.JSON)
                .body(Map.of("resetToken", "BAD-TOKEN", "newPassword", "N3wP@ss!"))
                .when().post("/api/auth/forgot-password/reset")
                .then().statusCode(400)
                .body("code", equalTo("RESET_TOKEN_INVALID"));
    }

    @Test
    @DisplayName("change-password: sai oldPassword → 400 INVALID_OLD_PASSWORD dù OTP đúng")
    void changePassword_shouldRejectWrongOldPasswordEvenWithValidOtp() {
        String email = "cp@example.com";
        registerOk(email, "cpuser", "P@ssw0rd!");
        readOtpFromRedisOrSeed(OtpPurpose.REGISTER, email, "222222");
        var tokens = given().contentType(ContentType.JSON)
                .body(Map.of("email", email, "otp", "222222"))
                .when().post("/api/auth/register/verify-email")
                .then().statusCode(200).extract().jsonPath();
        String access = tokens.getString("accessToken");

        // Yêu cầu OTP đổi mật khẩu
        given().header("Authorization", "Bearer " + access)
                .when().post("/api/auth/change-password/request-otp")
                .then().statusCode(202);

        // OTP đúng — nhưng oldPassword sai
        // userId là id của user vừa tạo; query Redis bằng cách enumerate keys
        var changeKey = redis.keys("otp:CHANGE:*").iterator().next();
        String userId = changeKey.substring("otp:CHANGE:".length());
        readOtpFromRedisOrSeed(OtpPurpose.CHANGE, userId, "333333");

        given().header("Authorization", "Bearer " + access)
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "oldPassword", "WRONG",
                        "otp", "333333",
                        "newPassword", "N3wP@ss!"))
                .when().post("/api/auth/change-password/confirm")
                .then().statusCode(400)
                .body("code", equalTo("INVALID_OLD_PASSWORD"));

        // OldPassword đúng + OTP đúng → đổi thành công
        given().header("Authorization", "Bearer " + access)
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "oldPassword", "P@ssw0rd!",
                        "otp", "333333",
                        "newPassword", "N3wP@ss!"))
                .when().post("/api/auth/change-password/confirm")
                .then().statusCode(200);

        // Login với mật khẩu mới hoạt động
        given().contentType(ContentType.JSON)
                .body(Map.of("email", email, "password", "N3wP@ss!"))
                .when().post("/api/auth/login")
                .then().statusCode(200);
    }

    @Test
    @DisplayName("change-password: không có Authorization → 403 (Spring Security default)")
    void changePassword_shouldRequireAuth() {
        given().when().post("/api/auth/change-password/request-otp")
                .then().statusCode(403);
    }

    @Test
    @DisplayName("verify-email: OTP sai → 400 OTP_INVALID")
    void verifyEmail_shouldRejectWrongOtp() {
        String email = "bad@example.com";
        registerOk(email, "baduser", "P@ssw0rd!");
        readOtpFromRedisOrSeed(OtpPurpose.REGISTER, email, "999999");

        given().contentType(ContentType.JSON)
                .body(Map.of("email", email, "otp", "000000"))
                .when().post("/api/auth/register/verify-email")
                .then().statusCode(400)
                .body("code", equalTo("OTP_INVALID"));
    }

    @Test
    @DisplayName("validation: register thiếu password → 400 VALIDATION_FAILED")
    void register_shouldValidateInput() {
        given().contentType(ContentType.JSON)
                .body(Map.of("email", "bad@example.com", "username", "u"))
                .when().post("/api/auth/register")
                .then().statusCode(400)
                .body("code", equalTo("VALIDATION_FAILED"));
    }
}
