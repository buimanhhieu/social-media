package com.instagram.module.auth.event;

import org.springframework.context.ApplicationEvent;

public class UserRegisteredEvent extends ApplicationEvent {
    private final Long userId;
    private final String email;
    private final String username;

    public UserRegisteredEvent(Object source, Long userId, String email, String username) {
        super(source);
        this.userId = userId;
        this.email = email;
        this.username = username;
    }

    public Long getUserId() { return userId; }
    public String getEmail() { return email; }
    public String getUsername() { return username; }
}
