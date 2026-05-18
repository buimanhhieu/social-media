package com.instagram.module.auth.exception;

import com.instagram.core.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class EmailOrUsernameTakenException extends BusinessException {
    public EmailOrUsernameTakenException() {
        super("Email or username already in use", HttpStatus.CONFLICT, "EMAIL_OR_USERNAME_TAKEN");
    }
}
