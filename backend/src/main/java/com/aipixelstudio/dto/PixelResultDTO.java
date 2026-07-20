package com.aipixelstudio.dto;

import com.aipixelstudio.entity.Pixel;

import java.util.List;

/**
 * 图片分析接口响应数据。
 * gridWidth、gridHeight 表示网格列和行；canvasWidth、canvasHeight 是扩展后的画布尺寸；pixelSize 是每个正方形像素格的边长（px）。
 */
public record PixelResultDTO(int gridWidth, int gridHeight, int pixelSize, int canvasWidth, int canvasHeight, List<Pixel> pixels) {
}
