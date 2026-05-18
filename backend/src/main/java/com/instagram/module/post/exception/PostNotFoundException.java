package com.instagram.module.post.exception;

import com.instagram.core.exception.ResourceNotFoundException;

public class PostNotFoundException extends ResourceNotFoundException {
    public PostNotFoundException(Long id) {
        super("Post", id);
    }
}
