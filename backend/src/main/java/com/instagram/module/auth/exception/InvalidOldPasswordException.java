package com.instagram.module.auth.exception;

import com.instagram.core.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class InvalidOldPasswordException extends BusinessException {
    public InvalidOldPasswordException() {
        super("Old password incorrect", HttpStatus.BAD_REQUEST, "INVALID_OLD_PASSWORD");
    }
}
