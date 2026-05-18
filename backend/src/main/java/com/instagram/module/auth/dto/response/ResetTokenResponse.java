package com.instagram.module.auth.dto.response;

public record ResetTokenResponse(String resetToken, long expiresIn) {}
