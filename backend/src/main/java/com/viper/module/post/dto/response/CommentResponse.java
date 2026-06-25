package com.viper.module.post.dto.response;

import com.viper.module.post.entity.Comment;
import com.viper.module.user.dto.response.UserSummary;

import java.time.Instant;

public record CommentResponse(
        Long id,
        String content,
        UserSummary author,
        Long parentId,
        Instant createdAt
) {
    public static CommentResponse from(Comment c, UserSummary author) {
        return new CommentResponse(c.getId(), c.getContent(), author, c.getParentId(), c.getCreatedAt());
    }
}
