package com.viper.module.auth.controller;

import com.viper.module.auth.dto.request.ForgotPasswordRequest;
import com.viper.module.auth.dto.request.ForgotPasswordResetRequest;
import com.viper.module.auth.dto.request.ForgotPasswordVerifyRequest;
import com.viper.module.auth.dto.response.MessageResponse;
import com.viper.module.auth.dto.response.ResetTokenResponse;
import com.viper.module.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/forgot-password")
@RequiredArgsConstructor
public class PasswordResetController {

    private final AuthService authService;

    @PostMapping("/request-otp")
    public ResponseEntity<MessageResponse> requestOtp(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPasswordRequestOtp(req.email());
        return ResponseEntity.accepted().body(MessageResponse.of("OTP sent if account exists"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ResetTokenResponse> verifyOtp(@Valid @RequestBody ForgotPasswordVerifyRequest req) {
        return ResponseEntity.ok(authService.forgotPasswordVerifyOtp(req));
    }

    @PostMapping("/reset")
    public ResponseEntity<MessageResponse> reset(@Valid @RequestBody ForgotPasswordResetRequest req) {
        authService.forgotPasswordReset(req);
        return ResponseEntity.ok(MessageResponse.of("Password updated"));
    }
}
