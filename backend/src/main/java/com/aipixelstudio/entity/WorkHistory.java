package com.aipixelstudio.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

/** 某个用户作品的一条可恢复操作快照。 */
@TableName("work_history")
public class WorkHistory {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long workId;
    private Long userId;
    private Integer operationNo;
    private String operationType;
    private String operationDesc;
    private String pixelData;
    private String softnessData;
    private String compressedSnapshot;
    private LocalDateTime createTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getWorkId() { return workId; }
    public void setWorkId(Long workId) { this.workId = workId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Integer getOperationNo() { return operationNo; }
    public void setOperationNo(Integer operationNo) { this.operationNo = operationNo; }
    public String getOperationType() { return operationType; }
    public void setOperationType(String operationType) { this.operationType = operationType; }
    public String getOperationDesc() { return operationDesc; }
    public void setOperationDesc(String operationDesc) { this.operationDesc = operationDesc; }
    public String getPixelData() { return pixelData; }
    public void setPixelData(String pixelData) { this.pixelData = pixelData; }
    public String getSoftnessData() { return softnessData; }
    public void setSoftnessData(String softnessData) { this.softnessData = softnessData; }
    public String getCompressedSnapshot() { return compressedSnapshot; }
    public void setCompressedSnapshot(String compressedSnapshot) { this.compressedSnapshot = compressedSnapshot; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
}
