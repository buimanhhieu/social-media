package com.viper.module.media.entity;

import java.io.Serializable;

public record MusicSaveId(Long userId, Long musicId) implements Serializable {}
