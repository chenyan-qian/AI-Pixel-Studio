package com.aipixelstudio.service.impl;

import com.aipixelstudio.dto.PixelResultDTO;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PixelServiceImplTest {
    @Test
    void samplesTheCentreColourForEachSourceRegionWithoutCreatingAFile() throws Exception {
        BufferedImage source = new BufferedImage(64, 64, BufferedImage.TYPE_INT_RGB);
        source.setRGB(2, 2, 0xFF501400);
        for (int y = 62; y < 64; y++) {
            for (int x = 62; x < 64; x++) source.setRGB(x, y, 0xFFFFFFFF);
        }
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(source, "png", output);

        MockMultipartFile file = new MockMultipartFile("file", "source.png", "image/png", output.toByteArray());
        PixelResultDTO result = new PixelServiceImpl().analyze(file, 4);

        assertEquals(16, result.gridWidth());
        assertEquals(16, result.gridHeight());
        assertEquals(4, result.pixelSize());
        assertEquals(64, result.canvasWidth());
        assertEquals(64, result.canvasHeight());
        assertEquals(256, result.pixels().size());
        assertEquals("#501400", result.pixels().get(0).color());
        assertEquals("#FFFFFF", result.pixels().get(result.pixels().size() - 1).color());
    }

    @Test
    void expandsTheCanvasWithoutRequiringDimensionsToBeDivisible() throws Exception {
        BufferedImage source = new BufferedImage(1000, 700, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(source, "png", output);

        PixelResultDTO result = new PixelServiceImpl().analyze(new MockMultipartFile("file", "source.png", "image/png", output.toByteArray()), 16);

        assertEquals(63, result.gridWidth());
        assertEquals(44, result.gridHeight());
        assertEquals(1008, result.canvasWidth());
        assertEquals(704, result.canvasHeight());
        assertEquals(63 * 44, result.pixels().size());
    }
}
