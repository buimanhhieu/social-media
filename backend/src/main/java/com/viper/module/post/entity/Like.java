package com.viper.module.post.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "likes", schema = "post_schema")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(LikeId.class)
public class Like {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "post_id")
    private Long postId;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
