package com.viper.module.user.service;

import com.viper.core.exception.BusinessException;
import com.viper.core.exception.ResourceNotFoundException;
import com.viper.module.user.entity.Follow;
import com.viper.module.user.entity.User;
import com.viper.module.user.event.UserFollowedEvent;
import com.viper.module.user.repository.FollowRepository;
import com.viper.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher events;

    public void follow(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) {
            throw new BusinessException("Không thể tự theo dõi chính mình",
                    HttpStatus.BAD_REQUEST, "CANNOT_FOLLOW_SELF");
        }
        if (!userRepository.existsById(followingId)) {
            throw new ResourceNotFoundException("User", followingId);
        }
        if (!followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            followRepository.save(Follow.builder()
                    .followerId(followerId)
                    .followingId(followingId)
                    .build());
            String followerUsername = userRepository.findById(followerId)
                    .map(User::getUsername).orElse(null);
            events.publishEvent(new UserFollowedEvent(this, followerId, followingId, followerUsername));
        }
    }

    public void unfollow(Long followerId, Long followingId) {
        followRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);
    }
}
