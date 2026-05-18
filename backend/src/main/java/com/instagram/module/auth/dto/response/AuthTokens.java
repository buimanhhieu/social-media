package com.instagram.module.auth.dto.response;

public record AuthTokens(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn
) {
    public static AuthTokens of(String accessToken, String refreshToken, long accessExpirySeconds) {
        return new AuthTokens(accessToken, refreshToken, "Bearer", accessExpirySeconds);
    }
}
