package com.viper.module.post.dto.response;

import com.viper.module.post.entity.Post;
import com.viper.module.post.entity.PostType;

public record PostSummary(
        Long id,
        String thumbnailUrl,
        PostType type
) {
    public static PostSummary from(Post post) {
        String thumb = post.getMediaList().stream()
                .findFirst()
                .map(m -> m.getThumbUrl() != null ? m.getThumbUrl() : m.getMediaUrl())
                .orElse(null);
        return new PostSummary(post.getId(), thumb, post.getType());
    }
}
