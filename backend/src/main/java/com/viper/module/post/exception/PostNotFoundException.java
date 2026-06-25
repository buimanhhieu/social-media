package com.viper.module.post.exception;

import com.viper.core.exception.ResourceNotFoundException;

public class PostNotFoundException extends ResourceNotFoundException {
    public PostNotFoundException(Long id) {
        super("Post", id);
    }
}
