package com.viper.module.user.controller;

import com.viper.module.user.dto.request.UpdateProfileRequest;
import com.viper.module.user.dto.response.UserProfileResponse;
import com.viper.module.user.dto.response.UserSummary;
import com.viper.module.user.service.UserCommandService;
import com.viper.module.user.service.UserQueryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserQueryService userQueryService;
    private final UserCommandService userCommandService;

    /** Hồ sơ của người đang đăng nhập. */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> me(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(userQueryService.getProfile(userId, userId));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMe(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UpdateProfileRequest req) {
        userCommandService.updateProfile(userId, req);
        return ResponseEntity.ok(userQueryService.getProfile(userId, userId));
    }

    /** Gợi ý người để theo dõi. */
    @GetMapping("/suggestions")
    public ResponseEntity<List<UserSummary>> suggestions(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(userQueryService.getSuggestions(userId, 10));
    }

    /** Hồ sơ người khác theo username (kèm trạng thái đã theo dõi). */
    @GetMapping("/{username}")
    public ResponseEntity<UserProfileResponse> byUsername(
            @AuthenticationPrincipal Long userId,
            @PathVariable String username) {
        return ResponseEntity.ok(userQueryService.getProfileByUsername(username, userId));
    }
}
