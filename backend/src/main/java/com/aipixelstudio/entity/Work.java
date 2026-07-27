package com.aipixelstudio.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

/** 像素作品当前持久化后的主状态，与历史操作记录分开保存。 */
@TableName("works")
public class Work {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String title;
    private Integer pixelSize;
    private String sourceImageUrl;
    private String pixelImageUrl;
    private Integer imageWidth;
    private Integer imageHeight;
    private Integer gridWidth;
    private Integer gridHeight;
    private Integer canvasWidth;
    private Integer canvasHeight;
    private String pixelData;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getPixelSize() { return pixelSize; }
    public void setPixelSize(Integer pixelSize) { this.pixelSize = pixelSize; }
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
    public String getPixelData() { return pixelData; }
    public void setPixelData(String pixelData) { this.pixelData = pixelData; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
    public LocalDateTime getUpdateTime() { return updateTime; }
    public void setUpdateTime(LocalDateTime updateTime) { this.updateTime = updateTime; }
}
