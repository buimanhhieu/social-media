package com.viper.module.auth.dto.response;

public record ResetTokenResponse(String resetToken, long expiresIn) {}
