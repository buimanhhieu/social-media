-- liquibase formatted sql
-- changeset viper:create-notifications
CREATE TABLE notification_schema.notifications (
    id           BIGSERIAL   PRIMARY KEY,
    recipient_id BIGINT      NOT NULL REFERENCES user_schema.users(id) ON DELETE CASCADE,
    actor_id     BIGINT               REFERENCES user_schema.users(id) ON DELETE SET NULL,
    type         VARCHAR(30) NOT NULL,
    entity_id    BIGINT,
    entity_type  VARCHAR(20),
    message      TEXT        NOT NULL,
    is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif_recipient ON notification_schema.notifications(recipient_id, is_read, created_at DESC);
