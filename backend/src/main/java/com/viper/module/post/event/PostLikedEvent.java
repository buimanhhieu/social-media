package com.viper.module.post.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class PostLikedEvent extends ApplicationEvent {

    private final Long postId;
    private final Long postAuthorId;
    private final Long likerId;
    private final String likerUsername;

    public PostLikedEvent(Object source, Long postId, Long postAuthorId,
                          Long likerId, String likerUsername) {
        super(source);
        this.postId = postId;
        this.postAuthorId = postAuthorId;
        this.likerId = likerId;
        this.likerUsername = likerUsername;
    }
}
