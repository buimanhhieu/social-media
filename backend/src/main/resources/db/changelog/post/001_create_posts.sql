-- liquibase formatted sql
-- changeset instagram:create-posts
CREATE TABLE post_schema.posts (
    id         BIGSERIAL   PRIMARY KEY,
    author_id  BIGINT      NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    caption    TEXT,
    type       VARCHAR(10) NOT NULL DEFAULT 'IMAGE',
    location   VARCHAR(100),
    is_hidden  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_posts_author_created ON post_schema.posts(author_id, created_at DESC);
CREATE TABLE post_schema.post_media (
    id          BIGSERIAL    PRIMARY KEY,
    post_id     BIGINT       NOT NULL REFERENCES post_schema.posts(id) ON DELETE CASCADE,
    media_url   VARCHAR(500) NOT NULL,
    thumb_url   VARCHAR(500),
    order_index SMALLINT     NOT NULL DEFAULT 0,
    media_type  VARCHAR(10)  NOT NULL DEFAULT 'IMAGE'
);
CREATE TABLE post_schema.hashtags (
    id   BIGSERIAL    PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);
CREATE TABLE post_schema.post_hashtags (
    post_id    BIGINT NOT NULL REFERENCES post_schema.posts(id)    ON DELETE CASCADE,
    hashtag_id BIGINT NOT NULL REFERENCES post_schema.hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);
