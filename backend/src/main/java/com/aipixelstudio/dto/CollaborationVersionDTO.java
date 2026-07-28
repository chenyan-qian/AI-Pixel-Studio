package com.aipixelstudio.dto;

import jakarta.validation.constraints.NotBlank;

public class CollaborationVersionDTO {
    @NotBlank private String snapshot;
    private String description;
    public String getSnapshot() { return snapshot; } public void setSnapshot(String snapshot) { this.snapshot = snapshot; }
    public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
}
