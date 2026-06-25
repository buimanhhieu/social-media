package com.viper.module.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email @Size(max = 255)
        String email,

        @NotBlank
        @Pattern(regexp = "^[a-z0-9_.]{3,30}$",
                message = "username must be 3-30 chars, lowercase letters/digits/underscore/dot")
        String username,

        @NotBlank
        @Size(min = 8, max = 72)
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                message = "password must contain at least one letter and one digit")
        String password,

        @Size(max = 60)
        String displayName
) {}
