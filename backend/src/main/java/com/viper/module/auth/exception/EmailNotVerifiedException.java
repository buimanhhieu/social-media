package com.viper.module.auth.exception;

import com.viper.core.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class EmailNotVerifiedException extends BusinessException {
    public EmailNotVerifiedException() {
        super("Email not verified", HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED");
    }
}
