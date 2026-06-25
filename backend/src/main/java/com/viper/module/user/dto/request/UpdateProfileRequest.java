package com.viper.module.user.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 60) String displayName,
        @Size(max = 150) String bio,
        String websiteUrl,
        Boolean isPrivate
) {}
