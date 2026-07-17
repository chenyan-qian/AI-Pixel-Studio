package com.aipixelstudio.entity;

/**
 * 像素矩阵中的一个可编辑单元。
 * x、y 为网格坐标，color 为 #RRGGBB 格式的初始或编辑后颜色。
 */
public record Pixel(int x, int y, String color) {
}
