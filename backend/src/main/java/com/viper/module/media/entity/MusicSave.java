package com.viper.module.media.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "music_saves", schema = "media_schema")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(MusicSaveId.class)
public class MusicSave {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "music_id")
    private Long musicId;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
