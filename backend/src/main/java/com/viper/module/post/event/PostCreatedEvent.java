package com.viper.module.post.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class PostCreatedEvent extends ApplicationEvent {

    private final Long postId;
    private final Long authorId;
    private final String authorUsername;

    public PostCreatedEvent(Object source, Long postId, Long authorId, String authorUsername) {
        super(source);
        this.postId = postId;
        this.authorId = authorId;
        this.authorUsername = authorUsername;
    }
}
