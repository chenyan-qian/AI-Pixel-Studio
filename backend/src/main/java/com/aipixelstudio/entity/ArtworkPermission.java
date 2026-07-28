package com.aipixelstudio.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("artwork_permission")
public class ArtworkPermission {
    @TableId
    private Long artworkId;
    private String visibility;
    private Boolean allowEdit;
    private Boolean allowComment;
    private Boolean allowFork;

    public Long getArtworkId() { return artworkId; }
    public void setArtworkId(Long artworkId) { this.artworkId = artworkId; }
    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
    public Boolean getAllowEdit() { return allowEdit; }
    public void setAllowEdit(Boolean allowEdit) { this.allowEdit = allowEdit; }
    public Boolean getAllowComment() { return allowComment; }
    public void setAllowComment(Boolean allowComment) { this.allowComment = allowComment; }
    public Boolean getAllowFork() { return allowFork; }
    public void setAllowFork(Boolean allowFork) { this.allowFork = allowFork; }
}
