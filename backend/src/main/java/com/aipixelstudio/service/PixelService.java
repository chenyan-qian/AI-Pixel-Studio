package com.aipixelstudio.service;

import com.aipixelstudio.dto.PixelResultDTO;
import org.springframework.web.multipart.MultipartFile;

/** Image-analysis boundary reserved for subsequent pixel editing and AI transforms. */
public interface PixelService {
    PixelResultDTO analyze(MultipartFile file, int pixelSize);
}
