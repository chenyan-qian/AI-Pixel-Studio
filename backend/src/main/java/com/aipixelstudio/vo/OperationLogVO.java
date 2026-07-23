package com.aipixelstudio.vo;
import java.time.LocalDateTime;
public record OperationLogVO(Long id, Long userId, String username, String operation, LocalDateTime createTime) { }
