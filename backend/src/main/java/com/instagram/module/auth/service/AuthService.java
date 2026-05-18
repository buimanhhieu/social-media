package com.instagram.module.auth.service;

import com.instagram.core.security.JwtUtil;
import com.instagram.module.auth.dto.request.ChangePasswordConfirmRequest;
import com.instagram.module.auth.dto.request.ForgotPasswordResetRequest;
import com.instagram.module.auth.dto.request.ForgotPasswordVerifyRequest;
import com.instagram.module.auth.dto.request.LoginRequest;
import com.instagram.module.auth.dto.request.RegisterRequest;
import com.instagram.module.auth.dto.request.VerifyEmailRequest;
import com.instagram.module.auth.dto.response.AuthTokens;
import com.instagram.module.auth.dto.response.ResetTokenResponse;
import com.instagram.module.auth.event.EmailVerifiedEvent;
import com.instagram.module.auth.event.PasswordChangedEvent;
import com.instagram.module.auth.event.UserRegisteredEvent;
import com.instagram.module.auth.exception.EmailNotVerifiedException;
import com.instagram.module.auth.exception.EmailOrUsernameTakenException;
import com.instagram.module.auth.exception.InvalidCredentialsException;
import com.instagram.module.auth.exception.InvalidOldPasswordException;
import com.instagram.module.auth.exception.RefreshTokenInvalidException;
import com.instagram.module.auth.exception.ResetTokenInvalidException;
import com.instagram.module.user.dto.request.CreateUserCommand;
import com.instagram.module.user.dto.response.UserAuthView;
import com.instagram.module.user.service.UserCommandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserCommandService userCommandService;
    private final OtpService otpService;
    private final EmailService emailService;
    private final RefreshTokenStore refreshTokenStore;
    private final PasswordResetTokenStore passwordResetTokenStore;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final ApplicationEventPublisher events;

    public void register(RegisterRequest req) {
        if (userCommandService.existsByEmail(req.email())
                || userCommandService.existsByUsername(req.username())) {
            throw new EmailOrUsernameTakenException();
        }

        var created = userCommandService.createUnverifiedUser(new CreateUserCommand(
                req.email(),
                req.username(),
                passwordEncoder.encode(req.password()),
                req.displayName()
        ));

        events.publishEvent(new UserRegisteredEvent(this, created.id(), req.email(), req.username()));

        String otp = otpService.generateAndStore(OtpPurpose.REGISTER, req.email());
        emailService.sendOtp(req.email(), "REGISTER", otp);
    }

    public void resendRegisterOtp(String email) {
        if (!userCommandService.existsByEmail(email)) {
            log.info("Resend OTP skipped for unknown email");
            return;
        }
        var view = userCommandService.findAuthViewByEmail(email).orElse(null);
        if (view != null && view.verified()) {
            log.info("Resend OTP skipped for already verified email");
            return;
        }
        String otp = otpService.generateAndStore(OtpPurpose.REGISTER, email);
        emailService.sendOtp(email, "REGISTER", otp);
    }

    public AuthTokens verifyEmail(VerifyEmailRequest req) {
        UserAuthView view = userCommandService.findAuthViewByEmail(req.email())
                .orElseThrow(InvalidCredentialsException::new);

        otpService.verifyAndConsume(OtpPurpose.REGISTER, req.email(), req.otp());

        if (!view.verified()) {
            userCommandService.markEmailVerified(view.id());
        }
        events.publishEvent(new EmailVerifiedEvent(this, view.id(), view.email()));
        return issueTokens(view.id());
    }

    public AuthTokens login(LoginRequest req) {
        UserAuthView view = userCommandService.findAuthViewByEmail(req.email())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(req.password(), view.passwordHash())) {
            throw new InvalidCredentialsException();
        }
        if (!view.verified()) {
            throw new EmailNotVerifiedException();
        }
        return issueTokens(view.id());
    }

    public AuthTokens refresh(String refreshToken) {
        if (!jwtUtil.isValid(refreshToken) || !jwtUtil.isRefresh(refreshToken)) {
            throw new RefreshTokenInvalidException();
        }
        String jti = jwtUtil.extractJti(refreshToken);
        if (!refreshTokenStore.isWhitelisted(jti)) {
            throw new RefreshTokenInvalidException();
        }
        Long userId = jwtUtil.extractUserId(refreshToken);
        refreshTokenStore.revoke(jti);
        return issueTokens(userId);
    }

    public void logout(String refreshToken) {
        if (jwtUtil.isValid(refreshToken) && jwtUtil.isRefresh(refreshToken)) {
            String jti = jwtUtil.extractJti(refreshToken);
            refreshTokenStore.revoke(jti);
        }
    }

    public void forgotPasswordRequestOtp(String email) {
        if (!userCommandService.existsByEmail(email)) {
            log.info("Forgot-password OTP skipped for unknown email");
            return;
        }
        String otp = otpService.generateAndStore(OtpPurpose.FORGOT, email);
        emailService.sendOtp(email, "FORGOT_PASSWORD", otp);
    }

    public ResetTokenResponse forgotPasswordVerifyOtp(ForgotPasswordVerifyRequest req) {
        UserAuthView view = userCommandService.findAuthViewByEmail(req.email())
                .orElseThrow(ResetTokenInvalidException::new);

        otpService.verifyAndConsume(OtpPurpose.FORGOT, req.email(), req.otp());

        String token = passwordResetTokenStore.issue(view.id());
        return new ResetTokenResponse(token, PasswordResetTokenStore.RESET_TOKEN_TTL.toSeconds());
    }

    public void forgotPasswordReset(ForgotPasswordResetRequest req) {
        Long userId = passwordResetTokenStore.consume(req.resetToken());
        if (userId == null) {
            throw new ResetTokenInvalidException();
        }
        userCommandService.updatePasswordHash(userId, passwordEncoder.encode(req.newPassword()));
        refreshTokenStore.revokeAllForUser(userId);

        UserAuthView view = userCommandService.findAuthViewById(userId).orElse(null);
        if (view != null) {
            events.publishEvent(new PasswordChangedEvent(this, userId, view.email()));
        }
    }

    public void changePasswordRequestOtp(Long userId) {
        UserAuthView view = userCommandService.findAuthViewById(userId)
                .orElseThrow(InvalidCredentialsException::new);
        String otp = otpService.generateAndStore(OtpPurpose.CHANGE, String.valueOf(userId));
        emailService.sendOtp(view.email(), "CHANGE_PASSWORD", otp);
    }

    public void changePasswordConfirm(Long userId, ChangePasswordConfirmRequest req) {
        UserAuthView view = userCommandService.findAuthViewById(userId)
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(req.oldPassword(), view.passwordHash())) {
            throw new InvalidOldPasswordException();
        }
        otpService.verifyAndConsume(OtpPurpose.CHANGE, String.valueOf(userId), req.otp());

        userCommandService.updatePasswordHash(userId, passwordEncoder.encode(req.newPassword()));
        refreshTokenStore.revokeAllForUser(userId);
        events.publishEvent(new PasswordChangedEvent(this, userId, view.email()));
    }

    private AuthTokens issueTokens(Long userId) {
        String access = jwtUtil.generateAccessToken(userId);
        var refresh = jwtUtil.generateRefreshToken(userId);
        refreshTokenStore.store(refresh.jti(), userId, Duration.ofMillis(jwtUtil.getRefreshTokenExpiryMs()));
        return AuthTokens.of(access, refresh.token(), jwtUtil.getAccessTokenExpiryMs() / 1000);
    }
}
