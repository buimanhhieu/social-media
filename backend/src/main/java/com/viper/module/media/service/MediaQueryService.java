package com.viper.module.media.service;

import com.viper.module.media.dto.response.MediaRef;

import java.util.List;

/** Public read interface — other modules (e.g. post) resolve media through this, never via the repository. */
public interface MediaQueryService {

    /** Resolve media owned by {@code ownerId}, preserving the given id order. Throws if any id is missing or not owned. */
    List<MediaRef> resolveOwnedMedia(List<Long> mediaIds, Long ownerId);
}
