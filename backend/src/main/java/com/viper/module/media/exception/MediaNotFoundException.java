package com.viper.module.media.exception;

import com.viper.core.exception.ResourceNotFoundException;

public class MediaNotFoundException extends ResourceNotFoundException {
    public MediaNotFoundException(String message) {
        super(message);
    }
}
