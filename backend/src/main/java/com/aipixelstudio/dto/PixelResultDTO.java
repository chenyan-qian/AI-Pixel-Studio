package com.aipixelstudio.dto;

import com.aipixelstudio.entity.Pixel;

import java.util.List;

/** Complete editable grid returned by image analysis. */
public record PixelResultDTO(int size, List<Pixel> pixels) {
}
