package com.viper.module.auth.controller;

import com.viper.module.auth.dto.request.LoginRequest;
import com.viper.module.auth.dto.request.LogoutRequest;
import com.viper.module.auth.dto.request.RefreshRequest;
import com.viper.module.auth.dto.request.RegisterRequest;
import com.viper.module.auth.dto.request.ResendOtpRequest;
import com.viper.module.auth.dto.request.VerifyEmailRequest;
import com.viper.module.auth.dto.response.AuthTokens;
import com.viper.module.auth.dto.response.MessageResponse;
import com.viper.module.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.accepted().body(MessageResponse.of("OTP sent to email"));
    }

    @PostMapping("/register/resend-otp")
    public ResponseEntity<MessageResponse> resendRegisterOtp(@Valid @RequestBody ResendOtpRequest req) {
        authService.resendRegisterOtp(req.email());
        return ResponseEntity.accepted().body(MessageResponse.of("OTP sent if account exists"));
    }

    @PostMapping("/register/verify-email")
    public ResponseEntity<AuthTokens> verifyEmail(@Valid @RequestBody VerifyEmailRequest req) {
        return ResponseEntity.ok(authService.verifyEmail(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthTokens> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthTokens> refresh(@Valid @RequestBody RefreshRequest req) {
        return ResponseEntity.ok(authService.refresh(req.refreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest req) {
        authService.logout(req.refreshToken());
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
