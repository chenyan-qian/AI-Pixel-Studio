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

/** 将图片分析为可编辑像素网格的接口。 */
@RestController
@RequestMapping("/api/pixel")
public class PixelController {
    private final PixelService pixelService;

    public PixelController(PixelService pixelService) {
        this.pixelService = pixelService;
    }

    /**
     * 将上传图片转换为可编辑的像素矩阵；接口只返回 JSON，不生成处理后的图片文件。
     */
    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<PixelResultDTO> analyze(@RequestParam("file") MultipartFile file,
                                          @RequestParam("pixelSize") int pixelSize) {
        return Result.success(pixelService.analyze(file, pixelSize));
    }
}
