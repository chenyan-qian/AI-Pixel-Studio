package com.aipixelstudio.vo;
import java.time.LocalDateTime;
/** Existing works store pixel matrices rather than rendered image URLs. */
public record AdminArtworkVO(Long id, Long userId, String username, String title, Integer pixelSize, String sourceImageUrl, String finalPixelData, LocalDateTime createTime, LocalDateTime updateTime) { }
