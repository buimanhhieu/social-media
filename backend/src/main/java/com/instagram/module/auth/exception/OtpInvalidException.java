package com.instagram.module.auth.exception;

import com.instagram.core.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class OtpInvalidException extends BusinessException {
    public OtpInvalidException() {
        super("OTP invalid", HttpStatus.BAD_REQUEST, "OTP_INVALID");
    }
}
