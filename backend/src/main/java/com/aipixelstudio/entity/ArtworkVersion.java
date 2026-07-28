package com.aipixelstudio.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("artwork_version")
public class ArtworkVersion {
    @TableId(type = IdType.AUTO) private Long id;
    private Long artworkId;
    private Integer versionNumber;
    private String snapshotUrl;
    private Long creatorId;
    private String description;
    private LocalDateTime createTime;
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getArtworkId() { return artworkId; } public void setArtworkId(Long artworkId) { this.artworkId = artworkId; }
    public Integer getVersionNumber() { return versionNumber; } public void setVersionNumber(Integer versionNumber) { this.versionNumber = versionNumber; }
    public String getSnapshotUrl() { return snapshotUrl; } public void setSnapshotUrl(String snapshotUrl) { this.snapshotUrl = snapshotUrl; }
    public Long getCreatorId() { return creatorId; } public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }
    public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreateTime() { return createTime; } public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
}
