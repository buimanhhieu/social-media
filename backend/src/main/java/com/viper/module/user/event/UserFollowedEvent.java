package com.viper.module.user.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class UserFollowedEvent extends ApplicationEvent {

    private final Long followerId;
    private final Long followingId;
    private final String followerUsername;

    public UserFollowedEvent(Object source, Long followerId, Long followingId, String followerUsername) {
        super(source);
        this.followerId = followerId;
        this.followingId = followingId;
        this.followerUsername = followerUsername;
    }
}
