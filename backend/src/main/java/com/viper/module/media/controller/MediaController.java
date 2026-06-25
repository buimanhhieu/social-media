package com.viper.module.media.controller;

import com.viper.module.media.dto.response.MediaResponse;
import com.viper.module.media.entity.MediaContext;
import com.viper.module.media.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<MediaResponse> upload(
            @AuthenticationPrincipal Long userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "context", defaultValue = "POST") MediaContext context) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mediaService.uploadImage(userId, context, file));
    }
}
