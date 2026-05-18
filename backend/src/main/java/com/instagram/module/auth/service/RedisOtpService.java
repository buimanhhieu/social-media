package com.instagram.module.auth.service;

import com.instagram.module.auth.exception.OtpExpiredException;
import com.instagram.module.auth.exception.OtpInvalidException;
import com.instagram.module.auth.exception.OtpThrottledException;
import com.instagram.module.auth.exception.OtpTooManyAttemptsException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisOtpService implements OtpService {

    static final Duration OTP_TTL = Duration.ofMinutes(5);
    static final Duration RESEND_LOCK_TTL = Duration.ofSeconds(60);
    static final int MAX_ATTEMPTS = 5;

    private static final String FIELD_HASH = "hash";
    private static final String FIELD_ATTEMPTS = "attempts";
    private static final String FIELD_CREATED_AT = "createdAt";

    private final StringRedisTemplate redis;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    @Override
    public String generateAndStore(OtpPurpose purpose, String subject) {
        String lockKey = resendLockKey(purpose, subject);
        Boolean acquired = redis.opsForValue().setIfAbsent(lockKey, "1", RESEND_LOCK_TTL);
        if (Boolean.FALSE.equals(acquired)) {
            throw new OtpThrottledException();
        }

        String otp = generateSixDigit();
        String otpKey = otpKey(purpose, subject);
        HashOperations<String, Object, Object> hash = redis.opsForHash();

        redis.delete(otpKey);
        hash.putAll(otpKey, Map.of(
                FIELD_HASH, passwordEncoder.encode(otp),
                FIELD_ATTEMPTS, "0",
                FIELD_CREATED_AT, String.valueOf(System.currentTimeMillis())
        ));
        redis.expire(otpKey, OTP_TTL);

        log.info("OTP generated purpose={} subject={}", purpose, subject);
        return otp;
    }

    @Override
    public void verifyAndConsume(OtpPurpose purpose, String subject, String otp) {
        String otpKey = otpKey(purpose, subject);
        HashOperations<String, Object, Object> hash = redis.opsForHash();
        Map<Object, Object> entries = hash.entries(otpKey);

        if (entries.isEmpty()) {
            throw new OtpExpiredException();
        }

        int attempts = parseInt(entries.get(FIELD_ATTEMPTS));
        if (attempts >= MAX_ATTEMPTS) {
            redis.delete(otpKey);
            throw new OtpTooManyAttemptsException();
        }

        String storedHash = (String) entries.get(FIELD_HASH);
        if (storedHash == null || !passwordEncoder.matches(otp, storedHash)) {
            int next = attempts + 1;
            if (next >= MAX_ATTEMPTS) {
                redis.delete(otpKey);
                throw new OtpTooManyAttemptsException();
            }
            hash.put(otpKey, FIELD_ATTEMPTS, String.valueOf(next));
            throw new OtpInvalidException();
        }

        redis.delete(otpKey);
        log.info("OTP verified purpose={} subject={}", purpose, subject);
    }

    private static String otpKey(OtpPurpose purpose, String subject) {
        return "otp:" + purpose.name() + ":" + subject;
    }

    private static String resendLockKey(OtpPurpose purpose, String subject) {
        return "otp:resend-lock:" + purpose.name() + ":" + subject;
    }

    private String generateSixDigit() {
        int n = random.nextInt(1_000_000);
        return String.format("%06d", n);
    }

    private static int parseInt(Object raw) {
        if (raw == null) return 0;
        try { return Integer.parseInt(raw.toString()); } catch (NumberFormatException e) { return 0; }
    }
}
