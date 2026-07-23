package com.aipixelstudio.vo;
import java.time.LocalDateTime;
public record AdminFileVO(Long id, String fileName, String originalName, Long fileSize, String fileType, String username, LocalDateTime createTime, String url) { }
