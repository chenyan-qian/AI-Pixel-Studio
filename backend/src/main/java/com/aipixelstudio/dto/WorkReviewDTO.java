package com.aipixelstudio.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class WorkReviewDTO {
    @NotNull
    private Boolean approved;
    @Size(max = 500)
    private String reviewNote;

    public Boolean getApproved() { return approved; }
    public void setApproved(Boolean approved) { this.approved = approved; }
    public String getReviewNote() { return reviewNote; }
    public void setReviewNote(String reviewNote) { this.reviewNote = reviewNote; }
}
