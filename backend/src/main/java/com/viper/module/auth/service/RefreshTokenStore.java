package com.viper.module.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RefreshTokenStore {

    private final StringRedisTemplate redis;

    public void store(String jti, Long userId, Duration ttl) {
        redis.opsForValue().set(jtiKey(jti), userId.toString(), ttl);
        redis.opsForSet().add(userIndexKey(userId), jti);
        redis.expire(userIndexKey(userId), ttl);
    }

    public boolean isWhitelisted(String jti) {
        return Boolean.TRUE.equals(redis.hasKey(jtiKey(jti)));
    }

    public Long lookupUserId(String jti) {
        String raw = redis.opsForValue().get(jtiKey(jti));
        return raw == null ? null : Long.parseLong(raw);
    }

    public void revoke(String jti) {
        String raw = redis.opsForValue().get(jtiKey(jti));
        redis.delete(jtiKey(jti));
        if (raw != null) {
            redis.opsForSet().remove(userIndexKey(Long.parseLong(raw)), jti);
        }
    }

    public void revokeAllForUser(Long userId) {
        Set<String> jtis = redis.opsForSet().members(userIndexKey(userId));
        if (jtis != null) {
            for (String jti : jtis) {
                redis.delete(jtiKey(jti));
            }
        }
        redis.delete(userIndexKey(userId));
    }

    private static String jtiKey(String jti) { return "refresh-token:" + jti; }
    private static String userIndexKey(Long userId) { return "user-refresh-tokens:" + userId; }
}
