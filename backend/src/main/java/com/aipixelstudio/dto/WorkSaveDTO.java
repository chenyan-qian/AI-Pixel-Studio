package com.aipixelstudio.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** 保存作品时提交的请求体，包含当前画布和当前可见的历史分支。 */
public class WorkSaveDTO {
    private String title;
    @NotNull private Integer size;
    @NotNull private JsonNode pixelData;
    @NotNull @Valid private List<HistoryRecordSaveDTO> history;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }
    public JsonNode getPixelData() { return pixelData; }
    public void setPixelData(JsonNode pixelData) { this.pixelData = pixelData; }
    public List<HistoryRecordSaveDTO> getHistory() { return history; }
    public void setHistory(List<HistoryRecordSaveDTO> history) { this.history = history; }
}
