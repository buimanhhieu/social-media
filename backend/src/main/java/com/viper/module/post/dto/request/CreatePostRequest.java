package com.viper.module.post.dto.request;

import com.viper.module.post.entity.PostType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreatePostRequest(
        @NotEmpty(message = "Cần ít nhất 1 media") List<Long> mediaIds,
        @Size(max = 2200, message = "Caption tối đa 2200 ký tự") String caption,
        @Size(max = 100) String location,
        PostType type
) {}
