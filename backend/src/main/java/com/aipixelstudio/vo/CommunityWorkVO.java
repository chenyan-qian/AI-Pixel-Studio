package com.aipixelstudio.vo;

import java.time.LocalDateTime;

/** Lightweight public projection. Editor state and user IDs stay private. */
public record CommunityWorkVO(Long id, String title, String sourceImageUrl, String pixelImageUrl,
                              Integer pixelSize, Integer imageWidth, Integer imageHeight,
                              LocalDateTime publishedTime) { }
