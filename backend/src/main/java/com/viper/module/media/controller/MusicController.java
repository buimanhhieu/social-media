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

    /** Khám phá: tất cả nhạc (?q= để tìm theo tên). */
    @GetMapping
    public ResponseEntity<List<MusicResponse>> explore(
            @AuthenticationPrincipal Long userId,
            @RequestParam(value = "q", required = false) String q) {
        return ResponseEntity.ok(musicService.explore(userId, q));
    }

    /** Gợi ý. */
    @GetMapping("/suggested")
    public ResponseEntity<List<MusicResponse>> suggested(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(musicService.suggested(userId));
    }

    /** Đã lưu. */
    @GetMapping("/saved")
    public ResponseEntity<List<MusicResponse>> saved(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(musicService.saved(userId));
    }

    /** Import nhạc từ file audio HOẶC video (tự tách audio) → kho chung. */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<MusicResponse> upload(
            @AuthenticationPrincipal Long userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("name") String name) {
        return ResponseEntity.status(HttpStatus.CREATED).body(musicService.upload(userId, name, file));
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<Void> save(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        musicService.save(userId, id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/save")
    public ResponseEntity<Void> unsave(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        musicService.unsave(userId, id);
        return ResponseEntity.noContent().build();
    }
}
