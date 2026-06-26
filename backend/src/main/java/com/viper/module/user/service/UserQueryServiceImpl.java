package com.viper.module.user.service;

import com.viper.core.exception.ResourceNotFoundException;
import com.viper.module.user.dto.response.UserProfileResponse;
import com.viper.module.user.dto.response.UserSummary;
import com.viper.module.user.entity.User;
import com.viper.module.user.repository.FollowRepository;
import com.viper.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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

    @Override
    public UserProfileResponse getProfile(Long userId, Long viewerId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return buildProfile(u, viewerId);
    }

    @Override
    public UserProfileResponse getProfileByUsername(String username, Long viewerId) {
        User u = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return buildProfile(u, viewerId);
    }

    @Override
    public List<UserSummary> getSuggestions(Long viewerId, int limit) {
        List<Long> excluded = new ArrayList<>(followRepository.findFollowingIdsByUserId(viewerId));
        excluded.add(viewerId);
        return userRepository.findTop12ByIdNotInAndIsVerifiedTrueOrderByCreatedAtDesc(excluded).stream()
                .limit(limit)
                .map(u -> new UserSummary(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl()))
                .toList();
    }

    @Override
    public List<UserSummary> searchUsers(String query, Long viewerId, int limit) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        String q = query.trim();
        return userRepository
                .findTop20ByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(q, q).stream()
                .filter(u -> !u.getId().equals(viewerId))
                .limit(limit)
                .map(u -> new UserSummary(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl()))
                .toList();
    }

    private UserProfileResponse buildProfile(User u, Long viewerId) {
        long followers = followRepository.countByFollowingId(u.getId());
        long following = followRepository.countByFollowerId(u.getId());
        boolean isFollowing = viewerId != null && !viewerId.equals(u.getId())
                && followRepository.existsByFollowerIdAndFollowingId(viewerId, u.getId());
        return new UserProfileResponse(
                u.getId(), u.getUsername(), u.getDisplayName(), u.getBio(),
                u.getAvatarUrl(), u.getWebsiteUrl(), u.isPrivate(), u.isVerified(),
                followers, following, isFollowing);
    }

    @Override
    public List<UserSummary> getUserSummariesByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return userRepository.findAllById(ids).stream()
                .map(u -> new UserSummary(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl()))
                .toList();
    }
}
