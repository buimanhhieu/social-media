package com.viper.module.media.controller;

import com.viper.module.media.dto.response.MusicResponse;
import com.viper.module.media.service.MusicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/music")
@RequiredArgsConstructor
public class MusicController {

    private final MusicService musicService;

    /** Kho nhạc dùng chung (preset + do người dùng đẩy lên). */
    @GetMapping
    public ResponseEntity<List<MusicResponse>> list() {
        return ResponseEntity.ok(musicService.list());
    }

    /** Import nhạc từ file → lưu vào kho chung. */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<MusicResponse> upload(
            @AuthenticationPrincipal Long userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("name") String name) {
        return ResponseEntity.status(HttpStatus.CREATED).body(musicService.upload(userId, name, file));
    }
}
