package com.viper.module.media.dto.response;

import com.viper.module.media.entity.MediaFile;
import com.viper.module.media.entity.MediaType;

public record MediaResponse(
        Long id,
        String url,
        String thumbnailUrl,
        MediaType type,
        Integer width,
        Integer height
) {
    public static MediaResponse from(MediaFile m) {
        return new MediaResponse(
                m.getId(), m.getPublicUrl(), m.getThumbnailUrl(),
                m.getMediaType(), m.getWidthPx(), m.getHeightPx());
    }
}
