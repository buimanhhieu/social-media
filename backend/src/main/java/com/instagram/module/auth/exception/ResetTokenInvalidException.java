package com.instagram.module.auth.exception;

import com.instagram.core.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class ResetTokenInvalidException extends BusinessException {
    public ResetTokenInvalidException() {
        super("Reset token invalid or expired", HttpStatus.BAD_REQUEST, "RESET_TOKEN_INVALID");
    }
}
