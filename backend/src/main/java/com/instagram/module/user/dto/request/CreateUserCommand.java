package com.instagram.module.user.dto.request;

public record CreateUserCommand(
        String email,
        String username,
        String passwordHash,
        String displayName
) {}
