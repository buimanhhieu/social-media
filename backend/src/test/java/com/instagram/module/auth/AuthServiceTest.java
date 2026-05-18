package com.instagram.module.auth;

import com.instagram.core.security.JwtUtil;
import com.instagram.module.auth.dto.request.ChangePasswordConfirmRequest;
import com.instagram.module.auth.dto.request.ForgotPasswordResetRequest;
import com.instagram.module.auth.dto.request.ForgotPasswordVerifyRequest;
import com.instagram.module.auth.dto.request.LoginRequest;
import com.instagram.module.auth.dto.request.RegisterRequest;
import com.instagram.module.auth.dto.request.VerifyEmailRequest;
import com.instagram.module.auth.dto.response.AuthTokens;
import com.instagram.module.auth.event.EmailVerifiedEvent;
import com.instagram.module.auth.event.PasswordChangedEvent;
import com.instagram.module.auth.event.UserRegisteredEvent;
import com.instagram.module.auth.exception.EmailNotVerifiedException;
import com.instagram.module.auth.exception.EmailOrUsernameTakenException;
import com.instagram.module.auth.exception.InvalidCredentialsException;
import com.instagram.module.auth.exception.InvalidOldPasswordException;
import com.instagram.module.auth.exception.RefreshTokenInvalidException;
import com.instagram.module.auth.exception.ResetTokenInvalidException;
import com.instagram.module.auth.service.AuthService;
import com.instagram.module.auth.service.EmailService;
import com.instagram.module.auth.service.OtpPurpose;
import com.instagram.module.auth.service.OtpService;
import com.instagram.module.auth.service.PasswordResetTokenStore;
import com.instagram.module.auth.service.RefreshTokenStore;
import com.instagram.module.user.dto.request.CreateUserCommand;
import com.instagram.module.user.dto.response.UserAuthView;
import com.instagram.module.user.dto.response.UserSummary;
import com.instagram.module.user.service.UserCommandService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService unit tests — toàn bộ dependency được mock")
class AuthServiceTest {

    @Mock private UserCommandService userCommandService;
    @Mock private OtpService otpService;
    @Mock private EmailService emailService;
    @Mock private RefreshTokenStore refreshTokenStore;
    @Mock private PasswordResetTokenStore passwordResetTokenStore;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private ApplicationEventPublisher events;

    @InjectMocks private AuthService authService;

    private static final String EMAIL = "alice@example.com";
    private static final String USERNAME = "alice";
    private static final String RAW_PASSWORD = "P@ssw0rd!";
    private static final String HASHED = "BCRYPT(P@ssw0rd!)";

    private static UserAuthView verifiedView() {
        return new UserAuthView(42L, EMAIL, USERNAME, HASHED, true);
    }

    private static UserAuthView unverifiedView() {
        return new UserAuthView(42L, EMAIL, USERNAME, HASHED, false);
    }

    private void stubAccessAndRefreshIssue() {
        when(jwtUtil.generateAccessToken(42L)).thenReturn("access-token");
        when(jwtUtil.generateRefreshToken(42L)).thenReturn(new JwtUtil.IssuedToken("refresh-token", "JTI"));
        when(jwtUtil.getAccessTokenExpiryMs()).thenReturn(900_000L);
        when(jwtUtil.getRefreshTokenExpiryMs()).thenReturn(2_592_000_000L);
    }

    // ───────────────────────── register ─────────────────────────

    @Test
    @DisplayName("register: email/username chưa tồn tại → tạo user, gửi OTP, publish UserRegisteredEvent")
    void register_shouldCreateUnverifiedUser() {
        when(userCommandService.existsByEmail(EMAIL)).thenReturn(false);
        when(userCommandService.existsByUsername(USERNAME)).thenReturn(false);
        when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn(HASHED);
        when(userCommandService.createUnverifiedUser(any(CreateUserCommand.class)))
                .thenReturn(new UserSummary(42L, USERNAME, "Alice", null));
        when(otpService.generateAndStore(OtpPurpose.REGISTER, EMAIL)).thenReturn("123456");

        authService.register(new RegisterRequest(EMAIL, USERNAME, RAW_PASSWORD, "Alice"));

        ArgumentCaptor<CreateUserCommand> cmd = ArgumentCaptor.forClass(CreateUserCommand.class);
        verify(userCommandService).createUnverifiedUser(cmd.capture());
        assertThat(cmd.getValue().passwordHash()).isEqualTo(HASHED);
        verify(emailService).sendOtp(EMAIL, "REGISTER", "123456");
        verify(events).publishEvent(any(UserRegisteredEvent.class));
    }

    @Test
    @DisplayName("register: email đã tồn tại → ném EmailOrUsernameTakenException, không gửi OTP")
    void register_shouldFailWhenEmailTaken() {
        when(userCommandService.existsByEmail(EMAIL)).thenReturn(true);

        assertThatThrownBy(() -> authService.register(
                new RegisterRequest(EMAIL, USERNAME, RAW_PASSWORD, "Alice")))
                .isInstanceOf(EmailOrUsernameTakenException.class);

        verify(userCommandService, never()).createUnverifiedUser(any());
        verify(otpService, never()).generateAndStore(any(), anyString());
    }

    @Test
    @DisplayName("resendRegisterOtp: email không tồn tại → không gửi mail (anti-enumeration), không ném")
    void resendRegisterOtp_shouldSilentlySkipUnknownEmail() {
        when(userCommandService.existsByEmail(EMAIL)).thenReturn(false);

        authService.resendRegisterOtp(EMAIL);

        verify(otpService, never()).generateAndStore(any(), anyString());
        verify(emailService, never()).sendOtp(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("resendRegisterOtp: email đã verify rồi → không gửi mail")
    void resendRegisterOtp_shouldSkipIfAlreadyVerified() {
        when(userCommandService.existsByEmail(EMAIL)).thenReturn(true);
        when(userCommandService.findAuthViewByEmail(EMAIL)).thenReturn(Optional.of(verifiedView()));

        authService.resendRegisterOtp(EMAIL);

        verify(otpService, never()).generateAndStore(any(), anyString());
    }

    // ───────────────────────── verify email ─────────────────────────

    @Test
    @DisplayName("verifyEmail: OTP đúng → mark verified, publish event, trả token")
    void verifyEmail_shouldMarkVerifiedAndReturnTokens() {
        when(userCommandService.findAuthViewByEmail(EMAIL)).thenReturn(Optional.of(unverifiedView()));
        stubAccessAndRefreshIssue();

        AuthTokens tokens = authService.verifyEmail(new VerifyEmailRequest(EMAIL, "123456"));

        verify(otpService).verifyAndConsume(OtpPurpose.REGISTER, EMAIL, "123456");
        verify(userCommandService).markEmailVerified(42L);
        verify(events).publishEvent(any(EmailVerifiedEvent.class));
        verify(refreshTokenStore).store(eq("JTI"), eq(42L), any());
        assertThat(tokens.accessToken()).isEqualTo("access-token");
        assertThat(tokens.refreshToken()).isEqualTo("refresh-token");
        assertThat(tokens.expiresIn()).isEqualTo(900);
        assertThat(tokens.tokenType()).isEqualTo("Bearer");
    }

    @Test
    @DisplayName("verifyEmail: email không tồn tại → InvalidCredentials")
    void verifyEmail_shouldThrowWhenUserMissing() {
        when(userCommandService.findAuthViewByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequest(EMAIL, "123456")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    // ───────────────────────── login ─────────────────────────

    @Test
    @DisplayName("login: thông tin đúng và verified → trả AuthTokens")
    void login_shouldReturnTokensWhenValid() {
        when(userCommandService.findAuthViewByEmail(EMAIL)).thenReturn(Optional.of(verifiedView()));
        when(passwordEncoder.matches(RAW_PASSWORD, HASHED)).thenReturn(true);
        stubAccessAndRefreshIssue();

        AuthTokens tokens = authService.login(new LoginRequest(EMAIL, RAW_PASSWORD));

        assertThat(tokens.accessToken()).isEqualTo("access-token");
        verify(refreshTokenStore).store(eq("JTI"), eq(42L), any());
    }

    @Test
    @DisplayName("login: email không tồn tại → InvalidCredentials")
    void login_shouldFailWhenEmailUnknown() {
        when(userCommandService.findAuthViewByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest(EMAIL, RAW_PASSWORD)))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    @DisplayName("login: sai password → InvalidCredentials")
    void login_shouldFailWhenPasswordMismatch() {
        when(userCommandService.findAuthViewByEmail(EMAIL)).thenReturn(Optional.of(verifiedView()));
        when(passwordEncoder.matches(RAW_PASSWORD, HASHED)).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest(EMAIL, RAW_PASSWORD)))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    @DisplayName("login: user chưa verify → EmailNotVerifiedException (HTTP 403)")
    void login_shouldFailWhenUnverified() {
        when(userCommandService.findAuthViewByEmail(EMAIL)).thenReturn(Optional.of(unverifiedView()));
        when(passwordEncoder.matches(RAW_PASSWORD, HASHED)).thenReturn(true);

        assertThatThrownBy(() -> authService.login(new LoginRequest(EMAIL, RAW_PASSWORD)))
                .isInstanceOf(EmailNotVerifiedException.class);
    }

    // ───────────────────────── refresh / logout ─────────────────────────

    @Test
    @DisplayName("refresh: token hợp lệ và whitelisted → rotate, trả token mới")
    void refresh_shouldRotateToken() {
        when(jwtUtil.isValid("refresh-old")).thenReturn(true);
        when(jwtUtil.isRefresh("refresh-old")).thenReturn(true);
        when(jwtUtil.extractJti("refresh-old")).thenReturn("OLD_JTI");
        when(refreshTokenStore.isWhitelisted("OLD_JTI")).thenReturn(true);
        when(jwtUtil.extractUserId("refresh-old")).thenReturn(42L);
        stubAccessAndRefreshIssue();

        AuthTokens tokens = authService.refresh("refresh-old");

        verify(refreshTokenStore).revoke("OLD_JTI");
        verify(refreshTokenStore).store(eq("JTI"), eq(42L), any());
        assertThat(tokens.accessToken()).isEqualTo("access-token");
    }

    @Test
    @DisplayName("refresh: token không phải REFRESH → RefreshTokenInvalidException")
    void refresh_shouldRejectAccessToken() {
        when(jwtUtil.isValid("not-a-refresh")).thenReturn(true);
        when(jwtUtil.isRefresh("not-a-refresh")).thenReturn(false);

        assertThatThrownBy(() -> authService.refresh("not-a-refresh"))
                .isInstanceOf(RefreshTokenInvalidException.class);
    }

    @Test
    @DisplayName("refresh: jti đã revoke → RefreshTokenInvalidException")
    void refresh_shouldRejectRevokedJti() {
        when(jwtUtil.isValid("rt")).thenReturn(true);
        when(jwtUtil.isRefresh("rt")).thenReturn(true);
        when(jwtUtil.extractJti("rt")).thenReturn("JTI");
        when(refreshTokenStore.isWhitelisted("JTI")).thenReturn(false);

        assertThatThrownBy(() -> authService.refresh("rt"))
                .isInstanceOf(RefreshTokenInvalidException.class);
    }

    @Test
    @DisplayName("logout: revoke jti từ Redis whitelist")
    void logout_shouldRevokeJti() {
        when(jwtUtil.isValid("rt")).thenReturn(true);
        when(jwtUtil.isRefresh("rt")).thenReturn(true);
        when(jwtUtil.extractJti("rt")).thenReturn("JTI");

        authService.logout("rt");

        verify(refreshTokenStore).revoke("JTI");
    }

    // ───────────────────────── forgot password ─────────────────────────

    @Test
    @DisplayName("forgotPasswordRequestOtp: email không tồn tại → không gửi mail (anti-enumeration)")
    void forgotPasswordRequestOtp_shouldSkipUnknownEmail() {
        when(userCommandService.existsByEmail(EMAIL)).thenReturn(false);

        authService.forgotPasswordRequestOtp(EMAIL);

        verify(otpService, never()).generateAndStore(any(), anyString());
        verify(emailService, never()).sendOtp(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("forgotPasswordRequestOtp: email tồn tại → tạo OTP và gửi mail")
    void forgotPasswordRequestOtp_shouldSendOtp() {
        when(userCommandService.existsByEmail(EMAIL)).thenReturn(true);
        when(otpService.generateAndStore(OtpPurpose.FORGOT, EMAIL)).thenReturn("654321");

        authService.forgotPasswordRequestOtp(EMAIL);

        verify(emailService).sendOtp(EMAIL, "FORGOT_PASSWORD", "654321");
    }

    @Test
    @DisplayName("forgotPasswordVerifyOtp: OTP đúng → cấp reset-token")
    void forgotPasswordVerifyOtp_shouldIssueResetToken() {
        when(userCommandService.findAuthViewByEmail(EMAIL)).thenReturn(Optional.of(verifiedView()));
        when(passwordResetTokenStore.issue(42L)).thenReturn("RESET_TOKEN");

        var resp = authService.forgotPasswordVerifyOtp(new ForgotPasswordVerifyRequest(EMAIL, "123456"));

        verify(otpService).verifyAndConsume(OtpPurpose.FORGOT, EMAIL, "123456");
        assertThat(resp.resetToken()).isEqualTo("RESET_TOKEN");
        assertThat(resp.expiresIn()).isEqualTo(600);
    }

    @Test
    @DisplayName("forgotPasswordReset: reset-token hợp lệ → update password + revoke all refresh + event")
    void forgotPasswordReset_shouldUpdatePasswordAndRevokeAllSessions() {
        when(passwordResetTokenStore.consume("RT")).thenReturn(42L);
        when(passwordEncoder.encode("N3wP@ssw0rd")).thenReturn("HASHED-NEW");
        when(userCommandService.findAuthViewById(42L)).thenReturn(Optional.of(verifiedView()));

        authService.forgotPasswordReset(new ForgotPasswordResetRequest("RT", "N3wP@ssw0rd"));

        verify(userCommandService).updatePasswordHash(42L, "HASHED-NEW");
        verify(refreshTokenStore).revokeAllForUser(42L);
        verify(events).publishEvent(any(PasswordChangedEvent.class));
    }

    @Test
    @DisplayName("forgotPasswordReset: reset-token đã hết hạn / sai → ResetTokenInvalidException")
    void forgotPasswordReset_shouldThrowWhenTokenInvalid() {
        when(passwordResetTokenStore.consume("BAD")).thenReturn(null);

        assertThatThrownBy(() -> authService.forgotPasswordReset(
                new ForgotPasswordResetRequest("BAD", "N3wP@ssw0rd")))
                .isInstanceOf(ResetTokenInvalidException.class);

        verify(userCommandService, never()).updatePasswordHash(any(), anyString());
    }

    // ───────────────────────── change password ─────────────────────────

    @Test
    @DisplayName("changePasswordRequestOtp: gửi OTP đến email của user đang đăng nhập")
    void changePasswordRequestOtp_shouldSendToCurrentUserEmail() {
        when(userCommandService.findAuthViewById(42L)).thenReturn(Optional.of(verifiedView()));
        when(otpService.generateAndStore(OtpPurpose.CHANGE, "42")).thenReturn("999999");

        authService.changePasswordRequestOtp(42L);

        verify(emailService).sendOtp(EMAIL, "CHANGE_PASSWORD", "999999");
    }

    @Test
    @DisplayName("changePasswordConfirm: sai oldPassword → InvalidOldPasswordException dù OTP đúng")
    void changePasswordConfirm_shouldRejectWrongOldPassword() {
        when(userCommandService.findAuthViewById(42L)).thenReturn(Optional.of(verifiedView()));
        when(passwordEncoder.matches("WRONG", HASHED)).thenReturn(false);

        assertThatThrownBy(() -> authService.changePasswordConfirm(
                42L, new ChangePasswordConfirmRequest("WRONG", "123456", "N3wP@ss1")))
                .isInstanceOf(InvalidOldPasswordException.class);

        verify(otpService, never()).verifyAndConsume(any(), anyString(), anyString());
        verify(userCommandService, never()).updatePasswordHash(any(), anyString());
    }

    @Test
    @DisplayName("changePasswordConfirm: oldPassword + OTP đúng → update + revoke-all + event")
    void changePasswordConfirm_shouldChangePasswordWhenValid() {
        when(userCommandService.findAuthViewById(42L)).thenReturn(Optional.of(verifiedView()));
        when(passwordEncoder.matches(RAW_PASSWORD, HASHED)).thenReturn(true);
        when(passwordEncoder.encode("N3wP@ss1")).thenReturn("HASHED-NEW");

        authService.changePasswordConfirm(
                42L, new ChangePasswordConfirmRequest(RAW_PASSWORD, "123456", "N3wP@ss1"));

        verify(otpService).verifyAndConsume(OtpPurpose.CHANGE, "42", "123456");
        verify(userCommandService).updatePasswordHash(42L, "HASHED-NEW");
        verify(refreshTokenStore).revokeAllForUser(42L);
        verify(events).publishEvent(any(PasswordChangedEvent.class));
    }
}
