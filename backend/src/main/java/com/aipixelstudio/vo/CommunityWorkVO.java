package com.aipixelstudio.vo;

import java.time.LocalDateTime;

/** Public gallery projection. Editor state and user IDs stay private. */
public record CommunityWorkVO(
        Long id,
        String title,
        String imageUrl,
        String username,
        String avatar,
        Integer pixelSize,
        Integer width,
        Integer height,
        long likeCount,
        long commentCount,
        LocalDateTime createTime,
        boolean collaborationEnabled,
        int onlineCount,
        long modificationCount
) { }
