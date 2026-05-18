package com.instagram.module.user.service;

import com.instagram.module.user.dto.request.CreateUserCommand;
import com.instagram.module.user.dto.response.UserAuthView;
import com.instagram.module.user.dto.response.UserSummary;

import java.util.Optional;

public interface UserCommandService {

    UserSummary createUnverifiedUser(CreateUserCommand cmd);

    void markEmailVerified(Long userId);

    void updatePasswordHash(Long userId, String newHash);

    Optional<UserAuthView> findAuthViewByEmail(String email);

    Optional<UserAuthView> findAuthViewById(Long userId);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);
}
