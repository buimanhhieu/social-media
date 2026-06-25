package com.viper.module.media.entity;

import com.viper.core.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "media_files", schema = "media_schema")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaFile extends BaseEntity {

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 10)
    private MediaType mediaType;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_context", nullable = false, length = 20)
    private MediaContext context;

    @Column(name = "s3_key", nullable = false, length = 500)
    private String s3Key;

    @Column(name = "public_url", nullable = false, length = 500)
    private String publicUrl;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "mime_type", length = 50)
    private String mimeType;

    @Column(name = "width_px")
    private Integer widthPx;

    @Column(name = "height_px")
    private Integer heightPx;
}
