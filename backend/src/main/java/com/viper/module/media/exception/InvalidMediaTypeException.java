package com.viper.module.media.exception;

import com.viper.core.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class InvalidMediaTypeException extends BusinessException {
    public InvalidMediaTypeException(String contentType) {
        super("Unsupported media type: " + contentType, HttpStatus.BAD_REQUEST, "INVALID_MEDIA_TYPE");
    }
}
