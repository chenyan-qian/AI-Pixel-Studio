package com.aipixelstudio.dto;

import jakarta.validation.constraints.NotBlank;

public class ArtworkPermissionDTO {
    @NotBlank private String visibility;
    private Boolean allowEdit;
    private Boolean allowComment;
    private Boolean allowFork;
    public String getVisibility() { return visibility; } public void setVisibility(String visibility) { this.visibility = visibility; }
    public Boolean getAllowEdit() { return allowEdit; } public void setAllowEdit(Boolean allowEdit) { this.allowEdit = allowEdit; }
    public Boolean getAllowComment() { return allowComment; } public void setAllowComment(Boolean allowComment) { this.allowComment = allowComment; }
    public Boolean getAllowFork() { return allowFork; } public void setAllowFork(Boolean allowFork) { this.allowFork = allowFork; }
}
