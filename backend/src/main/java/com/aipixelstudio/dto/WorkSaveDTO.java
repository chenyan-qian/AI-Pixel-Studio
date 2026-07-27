package com.aipixelstudio.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** 保存作品时提交的请求体，包含当前画布和当前可见的历史分支。 */
public class WorkSaveDTO {
    private String title;
    @NotNull private Integer size;
    private String sourceImageUrl;
    private String pixelImageUrl;
    @NotNull private Integer imageWidth;
    @NotNull private Integer imageHeight;
    @NotNull private Integer gridWidth;
    @NotNull private Integer gridHeight;
    @NotNull private Integer canvasWidth;
    @NotNull private Integer canvasHeight;
    @NotNull private JsonNode pixelData;
    @NotNull @Valid private List<HistoryRecordSaveDTO> history;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }
    public String getSourceImageUrl() { return sourceImageUrl; }
    public void setSourceImageUrl(String sourceImageUrl) { this.sourceImageUrl = sourceImageUrl; }
    public String getPixelImageUrl() { return pixelImageUrl; }
    public void setPixelImageUrl(String pixelImageUrl) { this.pixelImageUrl = pixelImageUrl; }
    public Integer getImageWidth() { return imageWidth; }
    public void setImageWidth(Integer imageWidth) { this.imageWidth = imageWidth; }
    public Integer getImageHeight() { return imageHeight; }
    public void setImageHeight(Integer imageHeight) { this.imageHeight = imageHeight; }
    public Integer getGridWidth() { return gridWidth; }
    public void setGridWidth(Integer gridWidth) { this.gridWidth = gridWidth; }
    public Integer getGridHeight() { return gridHeight; }
    public void setGridHeight(Integer gridHeight) { this.gridHeight = gridHeight; }
    public Integer getCanvasWidth() { return canvasWidth; }
    public void setCanvasWidth(Integer canvasWidth) { this.canvasWidth = canvasWidth; }
    public Integer getCanvasHeight() { return canvasHeight; }
    public void setCanvasHeight(Integer canvasHeight) { this.canvasHeight = canvasHeight; }
    public JsonNode getPixelData() { return pixelData; }
    public void setPixelData(JsonNode pixelData) { this.pixelData = pixelData; }
    public List<HistoryRecordSaveDTO> getHistory() { return history; }
    public void setHistory(List<HistoryRecordSaveDTO> history) { this.history = history; }
}
