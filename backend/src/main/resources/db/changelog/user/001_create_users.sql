-- liquibase formatted sql
-- changeset viper:create-users
CREATE TABLE user_schema.users (
    id            BIGSERIAL    PRIMARY KEY,
    username      VARCHAR(30)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    display_name  VARCHAR(60),
    bio           TEXT,
    avatar_url    VARCHAR(500),
    website_url   VARCHAR(500),
    is_private    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_username ON user_schema.users(username);
