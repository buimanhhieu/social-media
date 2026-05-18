package com.instagram.module.auth.controller;

import com.instagram.module.auth.dto.request.ChangePasswordConfirmRequest;
import com.instagram.module.auth.dto.response.MessageResponse;
import com.instagram.module.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/change-password")
@RequiredArgsConstructor
public class PasswordChangeController {

    private final AuthService authService;

    @PostMapping("/request-otp")
    public ResponseEntity<MessageResponse> requestOtp(@AuthenticationPrincipal Long userId) {
        authService.changePasswordRequestOtp(userId);
        return ResponseEntity.accepted().body(MessageResponse.of("OTP sent to your email"));
    }

    @PostMapping("/confirm")
    public ResponseEntity<MessageResponse> confirm(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ChangePasswordConfirmRequest req) {
        authService.changePasswordConfirm(userId, req);
        return ResponseEntity.ok(MessageResponse.of("Password changed"));
    }
}
