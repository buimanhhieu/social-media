package com.instagram.module.user.service;

import com.instagram.module.user.dto.response.UserSummary;

// Interface công khai — module khác chỉ được dùng cái này, không dùng UserRepository trực tiếp
public interface UserQueryService {
    UserSummary getUserSummaryById(Long userId);
    UserSummary getUserSummaryByUsername(String username);
    boolean existsById(Long userId);
}
