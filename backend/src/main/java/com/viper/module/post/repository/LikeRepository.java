package com.viper.module.post.repository;

import com.viper.module.post.entity.Like;
import com.viper.module.post.entity.LikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LikeRepository extends JpaRepository<Like, LikeId> {

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    long countByPostId(Long postId);

    void deleteByUserIdAndPostId(Long userId, Long postId);

    @Query("SELECT new com.viper.module.post.repository.PostCount(l.postId, COUNT(l)) "
            + "FROM Like l WHERE l.postId IN :postIds GROUP BY l.postId")
    List<PostCount> countByPostIds(@Param("postIds") List<Long> postIds);

    @Query("SELECT l.postId FROM Like l WHERE l.userId = :userId AND l.postId IN :postIds")
    List<Long> findLikedPostIds(@Param("userId") Long userId, @Param("postIds") List<Long> postIds);
}
