package com.viper.module.media.service;

import com.viper.module.media.dto.response.MediaRef;
import com.viper.module.media.entity.MediaFile;
import com.viper.module.media.exception.MediaNotFoundException;
import com.viper.module.media.repository.MediaFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MediaQueryServiceImpl implements MediaQueryService {

    private final MediaFileRepository mediaFileRepository;

    @Override
    public List<MediaRef> resolveOwnedMedia(List<Long> mediaIds, Long ownerId) {
        if (mediaIds == null || mediaIds.isEmpty()) {
            return List.of();
        }
        List<Long> distinct = mediaIds.stream().distinct().toList();
        List<MediaFile> files = mediaFileRepository.findByIdInAndOwnerId(distinct, ownerId);
        if (files.size() != distinct.size()) {
            throw new MediaNotFoundException("Một số media không tồn tại hoặc không thuộc về bạn");
        }
        Map<Long, MediaFile> byId = files.stream()
                .collect(Collectors.toMap(MediaFile::getId, Function.identity()));
        return distinct.stream()
                .map(byId::get)
                .map(m -> new MediaRef(m.getId(), m.getPublicUrl(), m.getThumbnailUrl(), m.getMediaType().name()))
                .toList();
    }
}
