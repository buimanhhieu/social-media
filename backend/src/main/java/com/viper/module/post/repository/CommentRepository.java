package com.viper.module.post.repository;

import com.viper.module.post.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    Page<Comment> findByPostIdOrderByCreatedAtDesc(Long postId, Pageable pageable);

    long countByPostId(Long postId);

    @Query("SELECT new com.viper.module.post.repository.PostCount(c.postId, COUNT(c)) "
            + "FROM Comment c WHERE c.postId IN :postIds GROUP BY c.postId")
    List<PostCount> countByPostIds(@Param("postIds") List<Long> postIds);
}
