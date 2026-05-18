package com.instagram.module.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordConfirmRequest(
        @NotBlank String oldPassword,

        @NotBlank @Pattern(regexp = "^\\d{6}$", message = "otp must be 6 digits") String otp,

        @NotBlank
        @Size(min = 8, max = 72)
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                message = "password must contain at least one letter and one digit")
        String newPassword
) {}
