package com.instagram.module.user.dto.response;

public record UserAuthView(
        Long id,
        String email,
        String username,
        String passwordHash,
        boolean verified
) {}
