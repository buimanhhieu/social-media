package com.instagram.module.user.entity;

import java.io.Serializable;

public record FollowId(Long followerId, Long followingId) implements Serializable {}
