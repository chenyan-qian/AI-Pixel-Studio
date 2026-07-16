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

/** Converts source-image regions into independently editable representative-colour grid cells. */
@Service
public class PixelServiceImpl implements PixelService {
    private static final Set<Integer> SUPPORTED_PIXEL_SIZES = Set.of(32, 64, 128, 256);
    private static final long MAX_IMAGE_PIXELS = 20_000_000L;

    @Override
    public PixelResultDTO analyze(MultipartFile file, int pixelSize) {
        validate(file, pixelSize);
        try {
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

    /** Samples each region's centre pixel; averaging would blur fine details into one cell colour. */
    private PixelResultDTO createGrid(BufferedImage source, int pixelSize) {
        List<Pixel> pixels = new ArrayList<>(pixelSize * pixelSize);
        int imageWidth = source.getWidth();
        int imageHeight = source.getHeight();

        for (int x = 0; x < pixelSize; x++) {
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
            int sampleX = Math.min(source.getWidth() - 1, startX);
            int sampleY = Math.min(source.getHeight() - 1, startY);
            return toHexColor(source.getRGB(sampleX, sampleY));
        }
        int sampleX = startX + (endX - startX) / 2;
        int sampleY = startY + (endY - startY) / 2;
        return toHexColor(source.getRGB(sampleX, sampleY));
    }

    private String toHexColor(int rgb) {
        return String.format("#%02X%02X%02X", (rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF);
    }

    private void validate(MultipartFile file, int pixelSize) {
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
