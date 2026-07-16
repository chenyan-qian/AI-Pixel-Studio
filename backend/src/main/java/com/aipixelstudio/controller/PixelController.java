package com.aipixelstudio.controller;

import com.aipixelstudio.common.Result;
import com.aipixelstudio.dto.PixelResultDTO;
import com.aipixelstudio.service.PixelService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** API endpoint that analyzes an image into an editable pixel grid. */
@RestController
@RequestMapping("/api/pixel")
public class PixelController {
    private final PixelService pixelService;

    public PixelController(PixelService pixelService) {
        this.pixelService = pixelService;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<PixelResultDTO> analyze(@RequestParam("file") MultipartFile file,
                                          @RequestParam("pixelSize") int pixelSize) {
        return Result.success(pixelService.analyze(file, pixelSize));
    }
}
