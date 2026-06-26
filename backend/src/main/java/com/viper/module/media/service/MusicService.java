package com.viper.module.media.service;

import com.viper.core.exception.BusinessException;
import com.viper.core.exception.ResourceNotFoundException;
import com.viper.infrastructure.storage.StorageService;
import com.viper.module.media.dto.response.MusicResponse;
import com.viper.module.media.entity.Music;
import com.viper.module.media.entity.MusicSave;
import com.viper.module.media.exception.InvalidMediaTypeException;
import com.viper.module.media.repository.MusicRepository;
import com.viper.module.media.repository.MusicSaveRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import ws.schild.jave.Encoder;
import ws.schild.jave.EncoderException;
import ws.schild.jave.MultimediaObject;
import ws.schild.jave.encode.AudioAttributes;
import ws.schild.jave.encode.EncodingAttributes;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MusicService {

    private final StorageService storageService;
    private final MusicRepository musicRepository;
    private final MusicSaveRepository musicSaveRepository;

    /** Khám phá: tất cả nhạc (có thể tìm theo tên). */
    public List<MusicResponse> explore(Long userId, String q) {
        List<Music> tracks = StringUtils.hasText(q)
                ? musicRepository.findTop50ByNameContainingIgnoreCaseOrderByCreatedAtDesc(q.trim())
                : musicRepository.findTop50ByOrderByCreatedAtDesc();
        return withSaved(tracks, userId);
    }

    /** Gợi ý: nhạc mới thêm gần đây. */
    public List<MusicResponse> suggested(Long userId) {
        return withSaved(musicRepository.findTop20ByOrderByCreatedAtDesc(), userId);
    }

    /** Đã lưu: nhạc người dùng đã lưu. */
    public List<MusicResponse> saved(Long userId) {
        List<Long> ids = musicSaveRepository.findMusicIdsByUserId(userId);
        if (ids.isEmpty()) return List.of();
        return musicRepository.findByIdIn(ids).stream()
                .map(m -> MusicResponse.from(m, true))
                .toList();
    }

    @Transactional
    public void save(Long userId, Long musicId) {
        if (!musicRepository.existsById(musicId)) {
            throw new ResourceNotFoundException("Music", musicId);
        }
        if (!musicSaveRepository.existsByUserIdAndMusicId(userId, musicId)) {
            musicSaveRepository.save(MusicSave.builder().userId(userId).musicId(musicId).build());
        }
    }

    @Transactional
    public void unsave(Long userId, Long musicId) {
        musicSaveRepository.deleteByUserIdAndMusicId(userId, musicId);
    }

    private List<MusicResponse> withSaved(List<Music> tracks, Long userId) {
        Set<Long> savedIds = new HashSet<>(musicSaveRepository.findMusicIdsByUserId(userId));
        return tracks.stream()
                .map(m -> MusicResponse.from(m, savedIds.contains(m.getId())))
                .toList();
    }

    /** Nhận file audio (lưu thẳng) HOẶC video (tách audio → mp3) rồi đẩy lên kho nhạc. */
    public MusicResponse upload(Long ownerId, String name, MultipartFile file) {
        if (!StringUtils.hasText(name)) {
            throw new BusinessException("Tên nhạc không được trống", HttpStatus.BAD_REQUEST, "MUSIC_NAME_REQUIRED");
        }
        String contentType = file.getContentType();
        boolean isAudio = contentType != null && contentType.startsWith("audio/");
        boolean isVideo = contentType != null && contentType.startsWith("video/");
        if (!isAudio && !isVideo) {
            throw new InvalidMediaTypeException(contentType);
        }
        try {
            byte[] data;
            String key;
            String storedType;
            if (isAudio) {
                data = file.getBytes();
                key = "audio/tracks/" + UUID.randomUUID() + extensionOf(file.getOriginalFilename());
                storedType = contentType;
            } else {
                data = extractAudio(file);
                key = "audio/tracks/" + UUID.randomUUID() + ".mp3";
                storedType = "audio/mpeg";
            }
            String url = storageService.upload(key, data, storedType);
            Music saved = musicRepository.save(Music.builder()
                    .name(name.trim())
                    .s3Key(key)
                    .url(url)
                    .ownerId(ownerId)
                    .isPreset(false)
                    .build());
            log.info("Uploaded music id={} name='{}' fromVideo={}", saved.getId(), saved.getName(), isVideo);
            return MusicResponse.from(saved, false);
        } catch (IOException e) {
            throw new BusinessException("Không xử lý được file",
                    HttpStatus.UNPROCESSABLE_ENTITY, "MUSIC_UPLOAD_FAILED");
        }
    }

    /** Tách audio từ video → MP3 (ffmpeg đóng gói trong JAVE2). */
    private byte[] extractAudio(MultipartFile video) throws IOException {
        File input = File.createTempFile("viper-vid-", extensionOf(video.getOriginalFilename()));
        File output = File.createTempFile("viper-aud-", ".mp3");
        try {
            Files.copy(video.getInputStream(), input.toPath(), StandardCopyOption.REPLACE_EXISTING);

            AudioAttributes audio = new AudioAttributes();
            audio.setCodec("libmp3lame");
            audio.setBitRate(192000);
            audio.setChannels(2);
            audio.setSamplingRate(44100);

            EncodingAttributes attrs = new EncodingAttributes();
            attrs.setOutputFormat("mp3");
            attrs.setAudioAttributes(audio);

            new Encoder().encode(new MultimediaObject(input), output, attrs);
            return Files.readAllBytes(output.toPath());
        } catch (EncoderException e) {
            throw new BusinessException("Không tách được nhạc từ video này",
                    HttpStatus.UNPROCESSABLE_ENTITY, "AUDIO_EXTRACT_FAILED");
        } finally {
            //noinspection ResultOfMethodCallIgnored
            input.delete();
            //noinspection ResultOfMethodCallIgnored
            output.delete();
        }
    }

    private static String extensionOf(String filename) {
        if (filename != null && filename.contains(".")) {
            String ext = filename.substring(filename.lastIndexOf('.'));
            if (ext.length() <= 6) return ext.toLowerCase();
        }
        return ".bin";
    }
}
