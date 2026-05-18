-- liquibase formatted sql
-- changeset instagram:create-likes-comments
CREATE TABLE post_schema.likes (
    user_id    BIGINT      NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    post_id    BIGINT      NOT NULL REFERENCES post_schema.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
CREATE INDEX idx_likes_post ON post_schema.likes(post_id);
CREATE TABLE post_schema.comments (
    id         BIGSERIAL   PRIMARY KEY,
    post_id    BIGINT      NOT NULL REFERENCES post_schema.posts(id)    ON DELETE CASCADE,
    author_id  BIGINT      NOT NULL REFERENCES user_schema.users(id)    ON DELETE CASCADE,
    parent_id  BIGINT               REFERENCES post_schema.comments(id) ON DELETE CASCADE,
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_comments_post ON post_schema.comments(post_id, created_at);
