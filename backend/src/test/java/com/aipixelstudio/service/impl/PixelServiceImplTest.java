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
        source.setRGB(0, 0, 0xFFC86428);
        source.setRGB(1, 0, 0xFF643C14);
        source.setRGB(0, 1, 0xFF14283C);
        source.setRGB(1, 1, 0xFF501400);
        for (int y = 62; y < 64; y++) {
            for (int x = 62; x < 64; x++) source.setRGB(x, y, 0xFFFFFFFF);
        }
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(source, "png", output);

        MockMultipartFile file = new MockMultipartFile("file", "source.png", "image/png", output.toByteArray());
        PixelResultDTO result = new PixelServiceImpl().analyze(file, 32);

        assertEquals(32, result.size());
        assertEquals(1024, result.pixels().size());
        assertEquals("#501400", result.pixels().get(0).color());
        assertEquals("#FFFFFF", result.pixels().get(result.pixels().size() - 1).color());
    }
}
