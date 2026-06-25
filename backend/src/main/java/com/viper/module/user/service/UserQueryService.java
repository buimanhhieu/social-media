package com.viper.module.user.service;

import com.viper.module.user.dto.response.UserSummary;

import java.util.List;

// Interface công khai — module khác chỉ được dùng cái này, không dùng UserRepository trực tiếp
public interface UserQueryService {
    UserSummary getUserSummaryById(Long userId);
    UserSummary getUserSummaryByUsername(String username);
    boolean existsById(Long userId);

    /** Lấy nhiều summary một lần (tránh N+1 khi dựng feed/danh sách). */
    List<UserSummary> getUserSummariesByIds(List<Long> ids);

    /** Id của những người mà {@code userId} đang theo dõi — dùng để dựng feed. */
    List<Long> getFollowingIds(Long userId);
}
