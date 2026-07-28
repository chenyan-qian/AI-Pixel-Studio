package com.aipixelstudio.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("pixel_operation")
public class PixelOperation {
    @TableId(type = IdType.AUTO) private Long id;
    private Long artworkId;
    private Long userId;
    private Integer x;
    private Integer y;
    private String oldColor;
    private String newColor;
    private LocalDateTime createTime;
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getArtworkId() { return artworkId; } public void setArtworkId(Long artworkId) { this.artworkId = artworkId; }
    public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
    public Integer getX() { return x; } public void setX(Integer x) { this.x = x; }
    public Integer getY() { return y; } public void setY(Integer y) { this.y = y; }
    public String getOldColor() { return oldColor; } public void setOldColor(String oldColor) { this.oldColor = oldColor; }
    public String getNewColor() { return newColor; } public void setNewColor(String newColor) { this.newColor = newColor; }
    public LocalDateTime getCreateTime() { return createTime; } public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
}
