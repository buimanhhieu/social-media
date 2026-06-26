package com.viper.module.media.service;

import com.viper.module.media.dto.response.MusicRef;
import com.viper.module.media.entity.Music;
import com.viper.module.media.repository.MusicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MusicQueryServiceImpl implements MusicQueryService {

    private final MusicRepository musicRepository;

    @Override
    public MusicRef getById(Long id) {
        if (id == null) return null;
        return musicRepository.findById(id).map(this::toRef).orElse(null);
    }

    @Override
    public List<MusicRef> getByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        return musicRepository.findByIdIn(ids).stream().map(this::toRef).toList();
    }

    private MusicRef toRef(Music m) {
        return new MusicRef(m.getId(), m.getName(), m.getUrl());
    }
}
