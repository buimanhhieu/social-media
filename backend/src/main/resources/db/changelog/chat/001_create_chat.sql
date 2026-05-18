-- liquibase formatted sql
-- changeset instagram:create-chat
CREATE TABLE chat_schema.conversations (
    id         BIGSERIAL   PRIMARY KEY,
    is_group   BOOLEAN     NOT NULL DEFAULT FALSE,
    name       VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE chat_schema.conversation_members (
    conversation_id BIGINT      NOT NULL REFERENCES chat_schema.conversations(id) ON DELETE CASCADE,
    user_id         BIGINT      NOT NULL REFERENCES user_schema.users(id)          ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);
CREATE TABLE chat_schema.messages (
    id              BIGSERIAL    PRIMARY KEY,
    conversation_id BIGINT       NOT NULL REFERENCES chat_schema.conversations(id) ON DELETE CASCADE,
    sender_id       BIGINT       NOT NULL REFERENCES user_schema.users(id)         ON DELETE CASCADE,
    content         TEXT,
    media_url       VARCHAR(500),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    seen_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_messages_conv ON chat_schema.messages(conversation_id, created_at DESC);
