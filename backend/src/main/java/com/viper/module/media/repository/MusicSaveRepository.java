package com.viper.module.media.repository;

import com.viper.module.media.entity.MusicSave;
import com.viper.module.media.entity.MusicSaveId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MusicSaveRepository extends JpaRepository<MusicSave, MusicSaveId> {

    boolean existsByUserIdAndMusicId(Long userId, Long musicId);

    void deleteByUserIdAndMusicId(Long userId, Long musicId);

    @Query("SELECT s.musicId FROM MusicSave s WHERE s.userId = :userId ORDER BY s.createdAt DESC")
    List<Long> findMusicIdsByUserId(@Param("userId") Long userId);
}
