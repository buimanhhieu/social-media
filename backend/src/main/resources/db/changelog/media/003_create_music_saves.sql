-- liquibase formatted sql
-- changeset viper:create-music-saves
CREATE TABLE media_schema.music_saves (
    user_id    BIGINT      NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    music_id   BIGINT      NOT NULL REFERENCES media_schema.music(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, music_id)
);
CREATE INDEX idx_music_saves_user ON media_schema.music_saves(user_id, created_at DESC);
