package com.viper.module.user.service;

import com.viper.core.exception.ResourceNotFoundException;
import com.viper.module.user.dto.request.CreateUserCommand;
import com.viper.module.user.dto.request.UpdateProfileRequest;
import com.viper.module.user.dto.response.UserAuthView;
import com.viper.module.user.dto.response.UserSummary;
import com.viper.module.user.entity.User;
import com.viper.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserCommandServiceImpl implements UserCommandService {

    private final UserRepository userRepository;

    @Override
    public UserSummary createUnverifiedUser(CreateUserCommand cmd) {
        User user = User.builder()
                .email(cmd.email())
                .username(cmd.username())
                .passwordHash(cmd.passwordHash())
                .displayName(cmd.displayName())
                .isVerified(false)
                .build();
        User saved = userRepository.save(user);
        return new UserSummary(saved.getId(), saved.getUsername(), saved.getDisplayName(), saved.getAvatarUrl());
    }

    @Override
    public void updateProfile(Long userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (req.displayName() != null) user.setDisplayName(req.displayName());
        if (req.bio() != null) user.setBio(req.bio());
        if (req.websiteUrl() != null) user.setWebsiteUrl(req.websiteUrl());
        if (req.avatarUrl() != null) user.setAvatarUrl(req.avatarUrl());
        if (req.isPrivate() != null) user.setPrivate(req.isPrivate());
    }

    @Override
    public void markEmailVerified(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setVerified(true);
    }

    @Override
    public void updatePasswordHash(Long userId, String newHash) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setPasswordHash(newHash);
        user.setLastPasswordChangeAt(Instant.now());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserAuthView> findAuthViewByEmail(String email) {
        return userRepository.findByEmail(email).map(this::toAuthView);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserAuthView> findAuthViewById(Long userId) {
        return userRepository.findById(userId).map(this::toAuthView);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    private UserAuthView toAuthView(User u) {
        return new UserAuthView(u.getId(), u.getEmail(), u.getUsername(), u.getPasswordHash(), u.isVerified());
    }
}
