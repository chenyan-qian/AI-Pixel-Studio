package com.aipixelstudio.service;

import com.aipixelstudio.dto.PixelResultDTO;
import org.springframework.web.multipart.MultipartFile;

/** 图片分析服务，为后续像素编辑和 AI 转换预留扩展边界。 */
public interface PixelService {
    /**
     * 按指定网格尺寸提取每个单元的初始颜色，为前端像素级编辑提供数据。
     */
    PixelResultDTO analyze(MultipartFile file, int pixelSize);
}
