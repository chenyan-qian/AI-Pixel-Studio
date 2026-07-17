package com.aipixelstudio.dto;

import com.aipixelstudio.entity.Pixel;

import java.util.List;

/**
 * 图片分析接口响应数据。
 * size 表示正方形网格边长，pixels 数量应为 size * size。
 */
public record PixelResultDTO(int size, List<Pixel> pixels) {
}
