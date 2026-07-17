package com.aipixelstudio.dto;

import com.fasterxml.jackson.databind.JsonNode;

public class HistoryRecordSaveDTO {
    private Integer id;
    private String operationType;
    private String operationDesc;
    private String operationTime;
    private JsonNode pixelData;
    private JsonNode softnessData;
    private String compressedSnapshot;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getOperationType() { return operationType; }
    public void setOperationType(String operationType) { this.operationType = operationType; }
    public String getOperationDesc() { return operationDesc; }
    public void setOperationDesc(String operationDesc) { this.operationDesc = operationDesc; }
    public String getOperationTime() { return operationTime; }
    public void setOperationTime(String operationTime) { this.operationTime = operationTime; }
    public JsonNode getPixelData() { return pixelData; }
    public void setPixelData(JsonNode pixelData) { this.pixelData = pixelData; }
    public JsonNode getSoftnessData() { return softnessData; }
    public void setSoftnessData(JsonNode softnessData) { this.softnessData = softnessData; }
    public String getCompressedSnapshot() { return compressedSnapshot; }
    public void setCompressedSnapshot(String compressedSnapshot) { this.compressedSnapshot = compressedSnapshot; }
}
