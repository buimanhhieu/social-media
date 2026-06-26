package com.viper.module.media.dto.response;

import com.viper.module.media.entity.Music;

public record MusicResponse(Long id, String name, String url, boolean saved) {
    public static MusicResponse from(Music m, boolean saved) {
        return new MusicResponse(m.getId(), m.getName(), m.getUrl(), saved);
    }
}
