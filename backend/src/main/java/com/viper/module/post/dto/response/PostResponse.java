package com.viper.module.post.dto.response;

import com.viper.module.post.entity.Post;
import com.viper.module.post.entity.PostType;
import com.viper.module.user.dto.response.UserSummary;

import java.time.Instant;
import java.util.List;

public record PostResponse(
        Long id,
        String caption,
        PostType type,
        String location,
        UserSummary author,
        List<MediaItem> media,
        MusicInfo music,
        long likeCount,
        long commentCount,
        boolean likedByMe,
        Instant createdAt
) {
    public record MediaItem(String url, String thumbnailUrl, String type) {}

    public record MusicInfo(Long id, String name, String url) {}

    public static PostResponse from(Post post, UserSummary author, MusicInfo music,
                                    long likeCount, long commentCount, boolean likedByMe) {
        List<MediaItem> media = post.getMediaList().stream()
                .map(m -> new MediaItem(m.getMediaUrl(), m.getThumbUrl(), m.getMediaType()))
                .toList();
        return new PostResponse(
                post.getId(), post.getCaption(), post.getType(), post.getLocation(),
                author, media, music, likeCount, commentCount, likedByMe, post.getCreatedAt());
    }
}
