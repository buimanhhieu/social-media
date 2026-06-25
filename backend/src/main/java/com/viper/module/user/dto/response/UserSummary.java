package com.viper.module.user.dto.response;

// DTO nhỏ dùng để trả ra cho module khác — không phải entity
public record UserSummary(
        Long id,
        String username,
        String displayName,
        String avatarUrl
) {}
