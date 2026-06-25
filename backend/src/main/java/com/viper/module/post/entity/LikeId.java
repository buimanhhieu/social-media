package com.viper.module.post.entity;

import java.io.Serializable;

public record LikeId(Long userId, Long postId) implements Serializable {}
