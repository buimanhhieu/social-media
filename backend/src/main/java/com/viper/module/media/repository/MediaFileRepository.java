package com.viper.module.media.repository;

import com.viper.module.media.entity.MediaFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MediaFileRepository extends JpaRepository<MediaFile, Long> {

    List<MediaFile> findByIdInAndOwnerId(List<Long> ids, Long ownerId);
}
