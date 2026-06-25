package com.viper.module.user.service;

import com.viper.core.exception.ResourceNotFoundException;
import com.viper.module.user.dto.response.UserSummary;
import com.viper.module.user.repository.FollowRepository;
import com.viper.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserQueryServiceImpl implements UserQueryService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;

    @Override
    public UserSummary getUserSummaryById(Long userId) {
        return userRepository.findById(userId)
                .map(u -> new UserSummary(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl()))
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }

    @Override
    public UserSummary getUserSummaryByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(u -> new UserSummary(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl()))
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    @Override
    public boolean existsById(Long userId) {
        return userRepository.existsById(userId);
    }

    @Override
    public List<Long> getFollowingIds(Long userId) {
        return followRepository.findFollowingIdsByUserId(userId);
    }
}
