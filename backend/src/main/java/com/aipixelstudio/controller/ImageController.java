package com.aipixelstudio.controller;

import com.aipixelstudio.common.Result;
import com.aipixelstudio.vo.ImageUploadVO;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;

/** 接收像素画工作流使用的原图。 */
@RestController
@RequestMapping("/api/image")
public class ImageController {
    private static final Set<String> SUPPORTED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Path UPLOAD_DIRECTORY = Path.of("uploads").toAbsolutePath().normalize();

    /**
     * 将支持的图片保存到本地 uploads 目录，并返回基础元数据。
     * 该接口继续由现有 JWT 拦截器保护。
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<ImageUploadVO> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) throw new IllegalArgumentException("请选择要上传的图片。");

        String originalName = file.getOriginalFilename();
        String fileName = originalName == null ? "" : Path.of(originalName).getFileName().toString();
        String extension = getExtension(fileName);
        if (!SUPPORTED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("只支持 JPG、JPEG、PNG 和 WEBP 格式的图片。");
        }

        try {
            ImageDimension dimension = readDimension(file, extension);
            Files.createDirectories(UPLOAD_DIRECTORY);
            Path target = UPLOAD_DIRECTORY.resolve(fileName).normalize();
            if (!target.getParent().equals(UPLOAD_DIRECTORY)) throw new IllegalArgumentException("无效的文件名。");
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return Result.success(new ImageUploadVO(fileName, "/uploads/" + fileName, dimension.width(), dimension.height()));
        } catch (IOException exception) {
            throw new IllegalArgumentException("图片保存失败，请稍后重试。");
        }
    }

    /** JPG/PNG 使用 ImageIO 读取尺寸，WebP 使用轻量级文件头解析器读取尺寸。 */
    private ImageDimension readDimension(MultipartFile file, String extension) throws IOException {
        if ("webp".equals(extension)) return readWebpDimension(file.getBytes());
        BufferedImage image = ImageIO.read(file.getInputStream());
        if (image == null) throw new IllegalArgumentException("上传的文件不是有效图片。");
        return new ImageDimension(image.getWidth(), image.getHeight());
    }

    /** 从 WebP 容器的 VP8、VP8L 或 VP8X 文件头中提取尺寸。 */
    private ImageDimension readWebpDimension(byte[] data) {
        if (data.length < 30 || !matches(data, 0, "RIFF") || !matches(data, 8, "WEBP")) {
            throw new IllegalArgumentException("上传的文件不是有效的 WEBP 图片。");
        }
        String chunkType = new String(data, 12, 4, java.nio.charset.StandardCharsets.US_ASCII);
        int payloadOffset = 20;
        if ("VP8X".equals(chunkType) && data.length >= payloadOffset + 10) {
            return new ImageDimension(read24(data, payloadOffset + 4) + 1, read24(data, payloadOffset + 7) + 1);
        }
        if ("VP8L".equals(chunkType) && data.length >= payloadOffset + 5 && (data[payloadOffset] & 0xFF) == 0x2F) {
            int width = (data[payloadOffset + 1] & 0xFF) | ((data[payloadOffset + 2] & 0x3F) << 8);
            int height = ((data[payloadOffset + 2] & 0xC0) >> 6) | ((data[payloadOffset + 3] & 0xFF) << 2) | ((data[payloadOffset + 4] & 0x0F) << 10);
            return new ImageDimension(width + 1, height + 1);
        }
        if ("VP8 ".equals(chunkType) && data.length >= payloadOffset + 10
                && (data[payloadOffset + 3] & 0xFF) == 0x9D && (data[payloadOffset + 4] & 0xFF) == 0x01 && (data[payloadOffset + 5] & 0xFF) == 0x2A) {
            int width = (data[payloadOffset + 6] & 0xFF) | ((data[payloadOffset + 7] & 0x3F) << 8);
            int height = (data[payloadOffset + 8] & 0xFF) | ((data[payloadOffset + 9] & 0x3F) << 8);
            return new ImageDimension(width, height);
        }
        throw new IllegalArgumentException("无法读取 WEBP 图片尺寸。");
    }

    /** 检查指定字节偏移量上的 ASCII 签名。 */
    private boolean matches(byte[] data, int offset, String value) {
        if (data.length < offset + value.length()) return false;
        for (int i = 0; i < value.length(); i++) if (data[offset + i] != (byte) value.charAt(i)) return false;
        return true;
    }

    /** 读取无符号 24 位小端整数。 */
    private int read24(byte[] data, int offset) {
        return (data[offset] & 0xFF) | ((data[offset + 1] & 0xFF) << 8) | ((data[offset + 2] & 0xFF) << 16);
    }

    /** 返回不带点号的小写扩展名。 */
    private String getExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 && lastDot < fileName.length() - 1 ? fileName.substring(lastDot + 1).toLowerCase(Locale.ROOT) : "";
    }

    /** Controller 内部使用的不可变图片宽高数据。 */
    private record ImageDimension(int width, int height) { }
}
