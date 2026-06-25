package com.viper.module.post.exception;

import com.viper.core.exception.ResourceNotFoundException;

public class CommentNotFoundException extends ResourceNotFoundException {
    public CommentNotFoundException(Long id) {
        super("Comment", id);
    }
}
