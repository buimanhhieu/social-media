package com.viper.module.media.service;

import com.viper.module.media.dto.response.MusicRef;

import java.util.List;

/** Interface công khai — module khác (post) lấy nhạc qua đây, không dùng repo trực tiếp. */
public interface MusicQueryService {

    MusicRef getById(Long id);

    List<MusicRef> getByIds(List<Long> ids);
}
