package com.viper.module.post.controller;

import com.viper.core.utils.PageResponse;
import com.viper.module.post.dto.request.CreatePostRequest;
import com.viper.module.post.dto.response.PostResponse;
import com.viper.module.post.dto.response.PostSummary;
import com.viper.module.post.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping("/posts")
    public ResponseEntity<PostResponse> create(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CreatePostRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.createPost(userId, req));
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<PostResponse> getOne(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(postService.getPostById(id, userId));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        postService.deletePost(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<PostResponse> like(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(postService.like(id, userId));
    }

    @DeleteMapping("/posts/{id}/like")
    public ResponseEntity<PostResponse> unlike(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(postService.unlike(id, userId));
    }

    @GetMapping("/feed")
    public ResponseEntity<PageResponse<PostResponse>> feed(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getFeed(userId, page, size));
    }

    @GetMapping("/users/{userId}/posts")
    public ResponseEntity<PageResponse<PostSummary>> userPosts(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(postService.getUserPosts(userId, page, size));
    }
}
