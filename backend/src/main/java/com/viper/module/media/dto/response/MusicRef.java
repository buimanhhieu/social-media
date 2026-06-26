package com.viper.module.media.dto.response;

/** Tham chiếu nhạc trao cho module khác (post) — không để entity vượt ranh giới. */
public record MusicRef(Long id, String name, String url) {}
