package com.viper.module.media.dto.response;

/** Resolved media reference handed to other modules (e.g. post) — no entity crosses the boundary. */
public record MediaRef(
        Long id,
        String mediaUrl,
        String thumbUrl,
        String mediaType
) {}
