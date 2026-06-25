-- liquibase formatted sql
-- changeset viper:create-media-files
CREATE TABLE media_schema.media_files (
    id              BIGSERIAL    PRIMARY KEY,
    owner_id        BIGINT       NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    media_type      VARCHAR(10)  NOT NULL,
    media_context   VARCHAR(20)  NOT NULL,
    s3_key          VARCHAR(500) NOT NULL,
    public_url      VARCHAR(500) NOT NULL,
    thumbnail_url   VARCHAR(500),
    file_size_bytes BIGINT,
    mime_type       VARCHAR(50),
    width_px        INTEGER,
    height_px       INTEGER,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
