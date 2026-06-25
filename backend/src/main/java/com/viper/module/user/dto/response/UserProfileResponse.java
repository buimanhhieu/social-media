package com.viper.module.user.dto.response;

public record UserProfileResponse(
        Long id,
        String username,
        String displayName,
        String bio,
        String avatarUrl,
        String websiteUrl,
        boolean isPrivate,
        boolean isVerified,
        long followersCount,
        long followingCount,
        boolean isFollowing
) {}
