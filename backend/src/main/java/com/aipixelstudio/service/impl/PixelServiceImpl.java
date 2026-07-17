package com.aipixelstudio.service.impl;

import com.aipixelstudio.dto.PixelResultDTO;
import com.aipixelstudio.entity.Pixel;
import com.aipixelstudio.service.PixelService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/** 将原图区域转换为可独立编辑的代表色网格单元。 */
@Service
public class PixelServiceImpl implements PixelService {
    /** 前端允许创建的正方形网格边长。 */
    private static final Set<Integer> SUPPORTED_PIXEL_SIZES = Set.of(32, 64, 128, 256);
    /** 防止超大图片在遍历或解码时消耗过多内存。 */
    private static final long MAX_IMAGE_PIXELS = 20_000_000L;

    @Override
    public PixelResultDTO analyze(MultipartFile file, int pixelSize) {
        validate(file, pixelSize);
        try {
            // ImageIO 只负责读取原图，不会缩放或写出任何新图片。
            BufferedImage source = ImageIO.read(file.getInputStream());
            if (source == null) throw new IllegalArgumentException("上传的文件不是有效图片，当前仅支持 JPG、JPEG 和 PNG 格式。");
            if ((long) source.getWidth() * source.getHeight() > MAX_IMAGE_PIXELS) {
                throw new IllegalArgumentException("图片分辨率过大，请上传 2000 万像素以内的图片。");
            }
            return createGrid(source, pixelSize);
        } catch (IOException exception) {
            throw new IllegalArgumentException("图片读取失败，请确认图片格式后重试。");
        }
    }

    /** 采样每个区域的中心像素；平均色会把细节混合成模糊的单元颜色。 */
    private PixelResultDTO createGrid(BufferedImage source, int pixelSize) {
        List<Pixel> pixels = new ArrayList<>(pixelSize * pixelSize);
        int imageWidth = source.getWidth();
        int imageHeight = source.getHeight();

        for (int x = 0; x < pixelSize; x++) {
            // 整数比例映射避免 imageWidth / pixelSize 截断后遗失边缘像素。
            int startX = x * imageWidth / pixelSize;
            int endX = (x + 1) * imageWidth / pixelSize;
            for (int y = 0; y < pixelSize; y++) {
                int startY = y * imageHeight / pixelSize;
                int endY = (y + 1) * imageHeight / pixelSize;
                pixels.add(new Pixel(x, y, sampleCenterColor(source, startX, endX, startY, endY)));
            }
        }
        return new PixelResultDTO(pixelSize, pixels);
    }

    private String sampleCenterColor(BufferedImage source, int startX, int endX, int startY, int endY) {
        if (startX >= endX || startY >= endY) {
            // 原图小于网格时，空区域重复使用对应的最近源像素，确保矩阵完整。
            int sampleX = Math.min(source.getWidth() - 1, startX);
            int sampleY = Math.min(source.getHeight() - 1, startY);
            return toHexColor(source.getRGB(sampleX, sampleY));
        }
        int sampleX = startX + (endX - startX) / 2;
        int sampleY = startY + (endY - startY) / 2;
        return toHexColor(source.getRGB(sampleX, sampleY));
    }

    private String toHexColor(int rgb) {
        // BufferedImage 返回 ARGB 整数；编辑器只保存不透明的 RGB 十六进制颜色。
        return String.format("#%02X%02X%02X", (rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF);
    }

    private void validate(MultipartFile file, int pixelSize) {
        // 在读取图片前完成参数校验，保证异常统一由全局处理器返回。
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("请先上传需要分析的图片。");
        if (!SUPPORTED_PIXEL_SIZES.contains(pixelSize)) {
            throw new IllegalArgumentException("pixelSize 仅支持 32、64、128 或 256。");
        }
        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equals("image/jpeg") || contentType.equals("image/png"))) {
            throw new IllegalArgumentException("图片格式错误，像素网格仅支持 JPG、JPEG 和 PNG 格式。");
        }
    }
}
