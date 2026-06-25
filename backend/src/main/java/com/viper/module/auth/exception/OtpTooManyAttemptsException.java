package com.viper.module.auth.exception;

import com.viper.core.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class OtpTooManyAttemptsException extends BusinessException {
    public OtpTooManyAttemptsException() {
        super("Too many invalid OTP attempts", HttpStatus.BAD_REQUEST, "OTP_TOO_MANY_ATTEMPTS");
    }
}
