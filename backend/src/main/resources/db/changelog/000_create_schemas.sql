-- liquibase formatted sql
-- changeset instagram:create-schemas
CREATE SCHEMA IF NOT EXISTS user_schema;
CREATE SCHEMA IF NOT EXISTS post_schema;
CREATE SCHEMA IF NOT EXISTS story_schema;
CREATE SCHEMA IF NOT EXISTS chat_schema;
CREATE SCHEMA IF NOT EXISTS notification_schema;
CREATE SCHEMA IF NOT EXISTS media_schema;
