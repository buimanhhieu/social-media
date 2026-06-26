package com.viper.module.media.service;

import com.viper.core.exception.BusinessException;
import com.viper.infrastructure.storage.StorageService;
import com.viper.module.media.dto.response.MusicResponse;
import com.viper.module.media.entity.Music;
import com.viper.module.media.exception.InvalidMediaTypeException;
import com.viper.module.media.repository.MusicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MusicService {

    private final StorageService storageService;
    private final MusicRepository musicRepository;

    public List<MusicResponse> list() {
        return musicRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(MusicResponse::from)
                .toList();
    }

    public MusicResponse upload(Long ownerId, String name, MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("audio/")) {
            throw new InvalidMediaTypeException(contentType);
        }
        if (!StringUtils.hasText(name)) {
            throw new BusinessException("Tên nhạc không được trống", HttpStatus.BAD_REQUEST, "MUSIC_NAME_REQUIRED");
        }
        try {
            String key = "audio/tracks/" + UUID.randomUUID() + extensionOf(file.getOriginalFilename());
            String url = storageService.upload(key, file.getBytes(), contentType);
            Music saved = musicRepository.save(Music.builder()
                    .name(name.trim())
                    .s3Key(key)
                    .url(url)
                    .ownerId(ownerId)
                    .isPreset(false)
                    .build());
            log.info("Uploaded music id={} name='{}' owner={}", saved.getId(), saved.getName(), ownerId);
            return MusicResponse.from(saved);
        } catch (IOException e) {
            throw new BusinessException("Không xử lý được file nhạc",
                    HttpStatus.UNPROCESSABLE_ENTITY, "MUSIC_UPLOAD_FAILED");
        }
    }

    private static String extensionOf(String filename) {
        if (filename != null && filename.contains(".")) {
            String ext = filename.substring(filename.lastIndexOf('.'));
            if (ext.length() <= 6) return ext.toLowerCase();
        }
        return ".mp3";
    }
}
