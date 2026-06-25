package com.viper.module.auth.exception;

import com.viper.core.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class RefreshTokenInvalidException extends BusinessException {
    public RefreshTokenInvalidException() {
        super("Refresh token invalid or expired", HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_INVALID");
    }
}
