package com.viper.module.auth;

import com.viper.module.auth.exception.OtpExpiredException;
import com.viper.module.auth.exception.OtpInvalidException;
import com.viper.module.auth.exception.OtpThrottledException;
import com.viper.module.auth.exception.OtpTooManyAttemptsException;
import com.viper.module.auth.service.OtpPurpose;
import com.viper.module.auth.service.RedisOtpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("OtpService unit tests — Redis & encoder mocked")
class OtpServiceTest {

    @Mock private StringRedisTemplate redis;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private HashOperations<String, Object, Object> hashOps;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private RedisOtpService otpService;

    @BeforeEach
    void wireRedisTemplate() {
        lenient().when(redis.opsForValue()).thenReturn(valueOps);
        lenient().when(redis.opsForHash()).thenReturn(hashOps);
    }

    @Test
    @DisplayName("generateAndStore: lưu OTP đã hash, trả OTP raw 6 chữ số")
    void generateAndStore_shouldStoreHashedOtp() {
        when(valueOps.setIfAbsent(eq("otp:resend-lock:REGISTER:a@b.com"), eq("1"), any(Duration.class)))
                .thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenAnswer(inv -> "HASH(" + inv.getArgument(0) + ")");

        String otp = otpService.generateAndStore(OtpPurpose.REGISTER, "a@b.com");

        assertThat(otp).matches("^\\d{6}$");
        verify(hashOps).putAll(eq("otp:REGISTER:a@b.com"), any(Map.class));
        verify(redis).expire(eq("otp:REGISTER:a@b.com"), eq(Duration.ofMinutes(5)));
    }

    @Test
    @DisplayName("generateAndStore: bị throttle khi resend-lock đang giữ")
    void generateAndStore_shouldThrowWhenLocked() {
        when(valueOps.setIfAbsent(anyString(), eq("1"), any(Duration.class))).thenReturn(false);

        assertThatThrownBy(() -> otpService.generateAndStore(OtpPurpose.REGISTER, "a@b.com"))
                .isInstanceOf(OtpThrottledException.class);

        verify(hashOps, never()).putAll(anyString(), any(Map.class));
    }

    @Test
    @DisplayName("verifyAndConsume: OTP đúng → xóa key")
    void verifyAndConsume_shouldDeleteOnSuccess() {
        Map<Object, Object> entries = new HashMap<>(Map.of(
                "hash", "HASH(123456)",
                "attempts", "0",
                "createdAt", "0"
        ));
        when(hashOps.entries("otp:REGISTER:a@b.com")).thenReturn(entries);
        when(passwordEncoder.matches("123456", "HASH(123456)")).thenReturn(true);

        otpService.verifyAndConsume(OtpPurpose.REGISTER, "a@b.com", "123456");

        verify(redis).delete("otp:REGISTER:a@b.com");
    }

    @Test
    @DisplayName("verifyAndConsume: không có OTP trong Redis → OtpExpiredException")
    void verifyAndConsume_shouldThrowExpiredWhenAbsent() {
        when(hashOps.entries("otp:FORGOT:a@b.com")).thenReturn(Map.of());

        assertThatThrownBy(() ->
                otpService.verifyAndConsume(OtpPurpose.FORGOT, "a@b.com", "123456"))
                .isInstanceOf(OtpExpiredException.class);
    }

    @Test
    @DisplayName("verifyAndConsume: sai OTP → tăng attempts, ném OtpInvalidException")
    void verifyAndConsume_shouldIncrementAttemptsOnInvalid() {
        Map<Object, Object> entries = new HashMap<>(Map.of(
                "hash", "HASH(real)",
                "attempts", "1",
                "createdAt", "0"
        ));
        when(hashOps.entries("otp:REGISTER:a@b.com")).thenReturn(entries);
        when(passwordEncoder.matches("000000", "HASH(real)")).thenReturn(false);

        assertThatThrownBy(() ->
                otpService.verifyAndConsume(OtpPurpose.REGISTER, "a@b.com", "000000"))
                .isInstanceOf(OtpInvalidException.class);

        verify(hashOps).put("otp:REGISTER:a@b.com", "attempts", "2");
        verify(redis, never()).delete(anyString());
    }

    @Test
    @DisplayName("verifyAndConsume: vượt MAX_ATTEMPTS → xóa key và ném OtpTooManyAttempts")
    void verifyAndConsume_shouldExhaustAttempts() {
        Map<Object, Object> entries = new HashMap<>(Map.of(
                "hash", "HASH(real)",
                "attempts", "4",
                "createdAt", "0"
        ));
        when(hashOps.entries("otp:REGISTER:a@b.com")).thenReturn(entries);
        when(passwordEncoder.matches("000000", "HASH(real)")).thenReturn(false);

        assertThatThrownBy(() ->
                otpService.verifyAndConsume(OtpPurpose.REGISTER, "a@b.com", "000000"))
                .isInstanceOf(OtpTooManyAttemptsException.class);

        verify(redis, times(1)).delete("otp:REGISTER:a@b.com");
    }
}
