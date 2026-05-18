-- liquibase formatted sql
-- changeset instagram:create-follows
CREATE TABLE user_schema.follows (
    follower_id  BIGINT      NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    following_id BIGINT      NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);
CREATE INDEX idx_follows_following ON user_schema.follows(following_id);
