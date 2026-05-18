package com.instagram.module.auth.exception;

import com.instagram.core.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class OtpExpiredException extends BusinessException {
    public OtpExpiredException() {
        super("OTP expired", HttpStatus.BAD_REQUEST, "OTP_EXPIRED");
    }
}
