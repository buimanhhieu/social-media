package com.viper.module.post.exception;

import com.viper.core.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class PostAccessDeniedException extends BusinessException {
    public PostAccessDeniedException() {
        super("Bạn không có quyền với bài viết này", HttpStatus.FORBIDDEN, "POST_ACCESS_DENIED");
    }
}
