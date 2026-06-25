package com.viper.module.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class PasswordResetTokenStore {

    public static final Duration RESET_TOKEN_TTL = Duration.ofMinutes(10);

    private final StringRedisTemplate redis;
    private final SecureRandom random = new SecureRandom();

    public String issue(Long userId) {
        String token = generateToken();
        redis.opsForValue().set(key(token), userId.toString(), RESET_TOKEN_TTL);
        return token;
    }

    /**
     * Atomically consume the token. Returns the userId if valid, null otherwise.
     * Uses GETDEL to prevent double-use races.
     */
    public Long consume(String token) {
        String raw = redis.opsForValue().getAndDelete(key(token));
        return raw == null ? null : Long.parseLong(raw);
    }

    private String generateToken() {
        byte[] buf = new byte[32];
        random.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    private static String key(String token) {
        return "pwd-reset:" + token;
    }
}
