package com.viper.module.media.entity;

import com.viper.core.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "music", schema = "media_schema")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Music extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "s3_key", nullable = false, length = 500)
    private String s3Key;

    @Column(nullable = false, length = 500)
    private String url;

    /** Người upload; null nếu là track preset của hệ thống. */
    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "is_preset", nullable = false)
    private boolean isPreset;
}
