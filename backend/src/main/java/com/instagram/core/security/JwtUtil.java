package com.instagram.core.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Component
public class JwtUtil {

    public static final String CLAIM_TYPE = "type";
    public static final String TYPE_ACCESS = "ACCESS";
    public static final String TYPE_REFRESH = "REFRESH";

    private final SecretKey secretKey;
    @Getter private final long accessTokenExpiryMs;
    @Getter private final long refreshTokenExpiryMs;

    public JwtUtil(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiry-ms}") long accessTokenExpiryMs,
            @Value("${app.jwt.refresh-token-expiry-ms}") long refreshTokenExpiryMs) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiryMs = accessTokenExpiryMs;
        this.refreshTokenExpiryMs = refreshTokenExpiryMs;
    }

    public String generateAccessToken(Long userId) {
        return buildToken(userId, UUID.randomUUID().toString(), TYPE_ACCESS, accessTokenExpiryMs);
    }

    public IssuedToken generateRefreshToken(Long userId) {
        String jti = UUID.randomUUID().toString();
        String token = buildToken(userId, jti, TYPE_REFRESH, refreshTokenExpiryMs);
        return new IssuedToken(token, jti);
    }

    private String buildToken(Long userId, String jti, String type, long expiryMs) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .id(jti)
                .claim(CLAIM_TYPE, type)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiryMs))
                .signWith(secretKey)
                .compact();
    }

    public Long extractUserId(String token) {
        return Long.valueOf(parseClaims(token).getSubject());
    }

    public String extractJti(String token) {
        return parseClaims(token).getId();
    }

    public String extractType(String token) {
        return parseClaims(token).get(CLAIM_TYPE, String.class);
    }

    public boolean isAccess(String token) {
        try {
            return TYPE_ACCESS.equals(extractType(token));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isRefresh(String token) {
        try {
            return TYPE_REFRESH.equals(extractType(token));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public record IssuedToken(String token, String jti) {}
}
