-- liquibase formatted sql
-- changeset viper:add-post-music
ALTER TABLE post_schema.posts
    ADD COLUMN music_id BIGINT REFERENCES media_schema.music(id) ON DELETE SET NULL;
