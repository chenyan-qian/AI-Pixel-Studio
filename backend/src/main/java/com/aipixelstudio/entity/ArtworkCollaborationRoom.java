package com.aipixelstudio.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("artwork_collaboration_room")
public class ArtworkCollaborationRoom {
    @TableId(type = IdType.AUTO) private Long id;
    private Long artworkId;
    private Integer onlineCount;
    private LocalDateTime createdTime;
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getArtworkId() { return artworkId; } public void setArtworkId(Long artworkId) { this.artworkId = artworkId; }
    public Integer getOnlineCount() { return onlineCount; } public void setOnlineCount(Integer onlineCount) { this.onlineCount = onlineCount; }
    public LocalDateTime getCreatedTime() { return createdTime; } public void setCreatedTime(LocalDateTime createdTime) { this.createdTime = createdTime; }
}
