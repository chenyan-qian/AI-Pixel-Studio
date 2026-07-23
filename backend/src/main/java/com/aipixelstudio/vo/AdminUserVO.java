package com.aipixelstudio.vo;
import java.time.LocalDateTime;
public record AdminUserVO(Long id, String username, LocalDateTime createTime, String role, Integer status) { }
