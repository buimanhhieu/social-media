package com.viper.module.media.entity;

public enum MediaContext {
    POST, STORY, AVATAR, MESSAGE;

    /** Folder segment used in the S3 key, e.g. images/<path>/{ownerId}/{uuid}.jpg */
    public String path() {
        return switch (this) {
            case POST -> "posts";
            case STORY -> "stories";
            case AVATAR -> "avatars";
            case MESSAGE -> "messages";
        };
    }
}
