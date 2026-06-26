package com.viper.module.post.repository;

import com.viper.module.post.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByAuthorIdAndIsHiddenFalseOrderByCreatedAtDesc(Long authorId, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.authorId IN :authorIds AND p.isHidden = false ORDER BY p.createdAt DESC")
    Page<Post> findFeedPosts(@Param("authorIds") List<Long> authorIds, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.authorId <> :userId AND p.isHidden = false ORDER BY p.createdAt DESC")
    Page<Post> findExplore(@Param("userId") Long userId, Pageable pageable);
}
