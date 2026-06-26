package com.viper.module.media.repository;

import com.viper.module.media.entity.Music;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MusicRepository extends JpaRepository<Music, Long> {

    List<Music> findAllByOrderByCreatedAtDesc();

    List<Music> findByIdIn(List<Long> ids);
}
