package com.viper.module.post.service;

import com.viper.core.utils.PageResponse;
import com.viper.module.post.dto.request.CreateCommentRequest;
import com.viper.module.post.dto.response.CommentResponse;
import com.viper.module.post.entity.Comment;
import com.viper.module.post.entity.Post;
import com.viper.module.post.exception.CommentNotFoundException;
import com.viper.module.post.exception.PostAccessDeniedException;
import com.viper.module.post.exception.PostNotFoundException;
import com.viper.module.post.repository.CommentRepository;
import com.viper.module.post.repository.PostRepository;
import com.viper.module.user.dto.response.UserSummary;
import com.viper.module.user.service.UserQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserQueryService userQueryService;

    public CommentResponse addComment(Long postId, Long authorId, CreateCommentRequest req) {
        if (!postRepository.existsById(postId)) {
            throw new PostNotFoundException(postId);
        }
        Comment comment = commentRepository.save(Comment.builder()
                .postId(postId)
                .authorId(authorId)
                .parentId(req.parentId())
                .content(req.content().trim())
                .build());
        UserSummary author = userQueryService.getUserSummaryById(authorId);
        return CommentResponse.from(comment, author);
    }

    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> listComments(Long postId, int page, int size) {
        Page<Comment> comments = commentRepository
                .findByPostIdOrderByCreatedAtDesc(postId, PageRequest.of(page, size));
        List<Long> authorIds = comments.getContent().stream()
                .map(Comment::getAuthorId).distinct().toList();
        Map<Long, UserSummary> authors = userQueryService.getUserSummariesByIds(authorIds).stream()
                .collect(Collectors.toMap(UserSummary::id, Function.identity()));
        return PageResponse.from(comments.map(c -> CommentResponse.from(c, authors.get(c.getAuthorId()))));
    }

    /** Xoá được nếu là tác giả bình luận, hoặc là chủ bài viết. */
    public void deleteComment(Long commentId, Long currentUserId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentNotFoundException(commentId));
        Long postAuthorId = postRepository.findById(comment.getPostId())
                .map(Post::getAuthorId)
                .orElse(null);
        if (!comment.getAuthorId().equals(currentUserId) && !currentUserId.equals(postAuthorId)) {
            throw new PostAccessDeniedException();
        }
        commentRepository.delete(comment);
    }
}
