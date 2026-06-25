package com.viper.module.post.service;

import com.viper.core.utils.PageResponse;
import com.viper.module.media.dto.response.MediaRef;
import com.viper.module.media.service.MediaQueryService;
import com.viper.module.post.dto.request.CreatePostRequest;
import com.viper.module.post.dto.response.PostResponse;
import com.viper.module.post.dto.response.PostSummary;
import com.viper.module.post.entity.Like;
import com.viper.module.post.entity.Post;
import com.viper.module.post.entity.PostMedia;
import com.viper.module.post.entity.PostType;
import com.viper.module.post.event.PostCreatedEvent;
import com.viper.module.post.event.PostLikedEvent;
import com.viper.module.post.exception.PostAccessDeniedException;
import com.viper.module.post.exception.PostNotFoundException;
import com.viper.module.post.repository.CommentRepository;
import com.viper.module.post.repository.LikeRepository;
import com.viper.module.post.repository.PostRepository;
import com.viper.module.user.dto.response.UserSummary;
import com.viper.module.user.service.UserQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final UserQueryService userQueryService;
    private final MediaQueryService mediaQueryService;
    private final ApplicationEventPublisher events;

    public PostResponse createPost(Long authorId, CreatePostRequest req) {
        UserSummary author = userQueryService.getUserSummaryById(authorId);
        List<MediaRef> refs = mediaQueryService.resolveOwnedMedia(req.mediaIds(), authorId);

        Post post = Post.builder()
                .authorId(authorId)
                .caption(req.caption())
                .type(req.type() != null ? req.type() : PostType.IMAGE)
                .location(req.location())
                .isHidden(false)
                .build();

        List<PostMedia> mediaList = new ArrayList<>();
        for (int i = 0; i < refs.size(); i++) {
            MediaRef ref = refs.get(i);
            mediaList.add(PostMedia.builder()
                    .post(post)
                    .mediaUrl(ref.mediaUrl())
                    .thumbUrl(ref.thumbUrl())
                    .orderIndex((short) i)
                    .mediaType(ref.mediaType())
                    .build());
        }
        post.setMediaList(mediaList);

        post = postRepository.save(post);
        events.publishEvent(new PostCreatedEvent(this, post.getId(), authorId, author.username()));

        return toResponse(post, authorId);
    }

    @Transactional(readOnly = true)
    public PostResponse getPostById(Long id, Long currentUserId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException(id));
        return toResponse(post, currentUserId);
    }

    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getFeed(Long userId, int page, int size) {
        List<Long> authorIds = new ArrayList<>(userQueryService.getFollowingIds(userId));
        authorIds.add(userId); // luôn gồm cả bài của chính mình
        Page<PostResponse> result = postRepository
                .findFeedPosts(authorIds, PageRequest.of(page, size))
                .map(p -> toResponse(p, userId));
        return PageResponse.from(result);
    }

    public PostResponse like(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new PostNotFoundException(postId));
        if (!likeRepository.existsByUserIdAndPostId(userId, postId)) {
            likeRepository.save(Like.builder().userId(userId).postId(postId).build());
            UserSummary liker = userQueryService.getUserSummaryById(userId);
            events.publishEvent(new PostLikedEvent(this, postId, post.getAuthorId(), userId, liker.username()));
        }
        return toResponse(post, userId);
    }

    public PostResponse unlike(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new PostNotFoundException(postId));
        likeRepository.deleteByUserIdAndPostId(userId, postId);
        return toResponse(post, userId);
    }

    /** Dựng PostResponse cho 1 post kèm số like và trạng thái đã-like của người xem. */
    private PostResponse toResponse(Post post, Long currentUserId) {
        UserSummary author = userQueryService.getUserSummaryById(post.getAuthorId());
        long likeCount = likeRepository.countByPostId(post.getId());
        long commentCount = commentRepository.countByPostId(post.getId());
        boolean likedByMe = currentUserId != null
                && likeRepository.existsByUserIdAndPostId(currentUserId, post.getId());
        return PostResponse.from(post, author, likeCount, commentCount, likedByMe);
    }

    public void deletePost(Long id, Long currentUserId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException(id));
        if (!post.getAuthorId().equals(currentUserId)) {
            throw new PostAccessDeniedException();
        }
        postRepository.delete(post);
    }

    @Transactional(readOnly = true)
    public PageResponse<PostSummary> getUserPosts(Long userId, int page, int size) {
        Page<PostSummary> result = postRepository
                .findByAuthorIdAndIsHiddenFalseOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(PostSummary::from);
        return PageResponse.from(result);
    }
}
