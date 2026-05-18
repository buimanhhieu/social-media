-- liquibase formatted sql
-- changeset instagram:create-stories
CREATE TABLE story_schema.stories (
    id         BIGSERIAL    PRIMARY KEY,
    author_id  BIGINT       NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    media_url  VARCHAR(500) NOT NULL,
    thumb_url  VARCHAR(500),
    media_type VARCHAR(10)  NOT NULL DEFAULT 'IMAGE',
    caption    TEXT,
    expires_at TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_stories_author_expires ON story_schema.stories(author_id, expires_at);
CREATE TABLE story_schema.story_views (
    story_id  BIGINT      NOT NULL REFERENCES story_schema.stories(id) ON DELETE CASCADE,
    viewer_id BIGINT      NOT NULL REFERENCES user_schema.users(id)    ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (story_id, viewer_id)
);
