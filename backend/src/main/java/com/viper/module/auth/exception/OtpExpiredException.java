package com.viper.module.auth.exception;

import com.viper.core.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class OtpExpiredException extends BusinessException {
    public OtpExpiredException() {
        super("OTP expired", HttpStatus.BAD_REQUEST, "OTP_EXPIRED");
    }
}
