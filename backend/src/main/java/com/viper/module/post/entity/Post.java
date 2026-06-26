package com.viper.module.post.entity;

import com.viper.core.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts", schema = "post_schema")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Post extends BaseEntity {

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PostType type;

    @Column(length = 100)
    private String location;

    @Column(name = "is_hidden", nullable = false)
    private boolean isHidden = false;

    /** Nhạc nền (id trong media_schema.music); null nếu không có. */
    @Column(name = "music_id")
    private Long musicId;

    @Builder.Default
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<PostMedia> mediaList = new ArrayList<>();
}
