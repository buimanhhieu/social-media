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
        Page<CommentResponse> result = commentRepository
                .findByPostIdOrderByCreatedAtDesc(postId, PageRequest.of(page, size))
                .map(c -> CommentResponse.from(c, userQueryService.getUserSummaryById(c.getAuthorId())));
        return PageResponse.from(result);
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
