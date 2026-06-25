package com.viper.module.post.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "post_media", schema = "post_schema")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(name = "media_url", nullable = false, length = 500)
    private String mediaUrl;

    @Column(name = "thumb_url", length = 500)
    private String thumbUrl;

    @Column(name = "order_index", nullable = false)
    private short orderIndex;

    @Column(name = "media_type", nullable = false, length = 10)
    private String mediaType;
}
