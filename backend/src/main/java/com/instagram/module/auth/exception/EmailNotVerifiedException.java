package com.instagram.module.auth.exception;

import com.instagram.core.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class EmailNotVerifiedException extends BusinessException {
    public EmailNotVerifiedException() {
        super("Email not verified", HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED");
    }
}
