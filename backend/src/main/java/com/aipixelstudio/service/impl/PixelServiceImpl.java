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
    /** 单个正方形像素格的固定可选边长。 */
    private static final Set<Integer> SUPPORTED_PIXEL_SIZES = Set.of(4, 8, 16, 32, 64);
    /** 防止超大图片在遍历或解码时消耗过多内存。 */
    private static final long MAX_IMAGE_PIXELS = 20_000_000L;

    @Override
    public PixelResultDTO analyze(MultipartFile file, int pixelSize) {
        validateFile(file);
        try {
            // ImageIO 只负责读取原图，不会缩放或写出任何新图片。
            BufferedImage source = ImageIO.read(file.getInputStream());
            if (source == null) throw new IllegalArgumentException("上传的文件不是有效图片，当前仅支持 JPG、JPEG 和 PNG 格式。");
            if ((long) source.getWidth() * source.getHeight() > MAX_IMAGE_PIXELS) {
                throw new IllegalArgumentException("图片分辨率过大，请上传 2000 万像素以内的图片。");
            }
            validatePixelSize(source, pixelSize);
            return createGrid(source, pixelSize);
        } catch (IOException exception) {
            throw new IllegalArgumentException("图片读取失败，请确认图片格式后重试。");
        }
    }

    /** 采样每个区域的中心像素；平均色会把细节混合成模糊的单元颜色。 */
    private PixelResultDTO createGrid(BufferedImage source, int pixelSize) {
        int imageWidth = source.getWidth();
        int imageHeight = source.getHeight();
        int canvasWidth = ((imageWidth + pixelSize - 1) / pixelSize) * pixelSize;
        int canvasHeight = ((imageHeight + pixelSize - 1) / pixelSize) * pixelSize;
        int gridWidth = canvasWidth / pixelSize;
        int gridHeight = canvasHeight / pixelSize;
        List<Pixel> pixels = new ArrayList<>(gridWidth * gridHeight);

        for (int x = 0; x < gridWidth; x++) {
            int startX = x * pixelSize;
            int endX = startX + pixelSize;
            for (int y = 0; y < gridHeight; y++) {
                int startY = y * pixelSize;
                int endY = startY + pixelSize;
                pixels.add(new Pixel(x, y, sampleCellColor(source, startX, endX, startY, endY)));
            }
        }
        return new PixelResultDTO(gridWidth, gridHeight, pixelSize, canvasWidth, canvasHeight, pixels);
    }

    private String sampleCellColor(BufferedImage source, int startX, int endX, int startY, int endY) {
        if (startX >= source.getWidth() || startY >= source.getHeight()) return "transparent";
        // 对贴近右边或底边的部分单元使用可见区域内的中心点，避免丢弃原图边缘内容。
        int visibleEndX = Math.min(endX, source.getWidth());
        int visibleEndY = Math.min(endY, source.getHeight());
        int sampleX = startX + (visibleEndX - startX) / 2;
        int sampleY = startY + (visibleEndY - startY) / 2;
        return toHexColor(source.getRGB(sampleX, sampleY));
    }

    private String toHexColor(int rgb) {
        // BufferedImage 返回 ARGB 整数；编辑器只保存不透明的 RGB 十六进制颜色。
        return String.format("#%02X%02X%02X", (rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF);
    }

    private void validateFile(MultipartFile file) {
        // 在读取图片前完成参数校验，保证异常统一由全局处理器返回。
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("请先上传需要分析的图片。");
        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equals("image/jpeg") || contentType.equals("image/png"))) {
            throw new IllegalArgumentException("图片格式错误，像素网格仅支持 JPG、JPEG 和 PNG 格式。");
        }
    }

    private void validatePixelSize(BufferedImage source, int pixelSize) {
        if (!SUPPORTED_PIXEL_SIZES.contains(pixelSize)) throw new IllegalArgumentException("像素格大小仅支持 4、8、16、32 或 64px。");
    }
}
