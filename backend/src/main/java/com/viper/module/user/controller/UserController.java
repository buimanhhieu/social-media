package com.viper.module.user.controller;

import com.viper.module.user.dto.response.UserSummary;
import com.viper.module.user.service.UserQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserQueryService userQueryService;

    /** Thông tin tóm tắt của người dùng đang đăng nhập (cho avatar/menu, trang cá nhân). */
    @GetMapping("/me")
    public ResponseEntity<UserSummary> me(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(userQueryService.getUserSummaryById(userId));
    }
}
