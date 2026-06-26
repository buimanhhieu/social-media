-- liquibase formatted sql
-- changeset viper:create-music
CREATE TABLE media_schema.music (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    s3_key     VARCHAR(500) NOT NULL,
    url        VARCHAR(500) NOT NULL,
    owner_id   BIGINT       REFERENCES user_schema.users(id) ON DELETE SET NULL,
    is_preset  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
