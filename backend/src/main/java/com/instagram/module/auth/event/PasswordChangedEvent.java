package com.instagram.module.auth.event;

import org.springframework.context.ApplicationEvent;

public class PasswordChangedEvent extends ApplicationEvent {
    private final Long userId;
    private final String email;

    public PasswordChangedEvent(Object source, Long userId, String email) {
        super(source);
        this.userId = userId;
        this.email = email;
    }

    public Long getUserId() { return userId; }
    public String getEmail() { return email; }
}
