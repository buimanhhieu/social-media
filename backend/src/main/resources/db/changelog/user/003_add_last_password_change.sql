-- liquibase formatted sql
-- changeset instagram:add-last-password-change-at
ALTER TABLE user_schema.users
    ADD COLUMN last_password_change_at TIMESTAMPTZ;
