package com.viper.module.post.repository;

/** Kết quả đếm gộp theo post_id (dùng cho batch like/comment count). */
public record PostCount(Long postId, Long count) {}
