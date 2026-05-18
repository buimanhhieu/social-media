package com.instagram.module.auth.exception;

import com.instagram.core.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class OtpThrottledException extends BusinessException {
    public OtpThrottledException() {
        super("OTP request too frequent", HttpStatus.TOO_MANY_REQUESTS, "OTP_THROTTLED");
    }
}
