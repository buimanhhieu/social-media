package com.instagram.module.user.repository;

import com.instagram.module.user.entity.Follow;
import com.instagram.module.user.entity.FollowId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, FollowId> {

    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    long countByFollowingId(Long userId);   // followers count
    long countByFollowerId(Long userId);    // following count

    @Query("SELECT f.followerId FROM Follow f WHERE f.followingId = :userId")
    List<Long> findFollowerIdsByUserId(@Param("userId") Long userId);

    @Query("SELECT f.followingId FROM Follow f WHERE f.followerId = :userId")
    List<Long> findFollowingIdsByUserId(@Param("userId") Long userId);
}
