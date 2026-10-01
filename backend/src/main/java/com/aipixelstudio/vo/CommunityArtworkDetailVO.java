package com.aipixelstudio.vo;

import com.aipixelstudio.entity.ArtworkPermission;
import com.aipixelstudio.entity.Work;
import java.time.LocalDateTime;
import java.util.List;

public record CommunityArtworkDetailVO(
        ArtworkVO artwork, String username, String avatar, ArtworkPermission permission,
        int onlineCount, long modificationCount, VersionVO latestVersion,
        List<VersionVO> versions, List<ContributorVO> contributors
) {
    public record ArtworkVO(Long id, String title, String sourceImageUrl, String pixelImageUrl,
                            Integer pixelSize, Integer imageWidth, Integer imageHeight,
                            Integer gridWidth, Integer gridHeight, Integer canvasWidth, Integer canvasHeight,
                            LocalDateTime publishedTime, LocalDateTime createTime) {
        public static ArtworkVO from(Work work) {
            return new ArtworkVO(work.getId(), work.getTitle(), work.getSourceImageUrl(), work.getPixelImageUrl(),
                    work.getPixelSize(), work.getImageWidth(), work.getImageHeight(), work.getGridWidth(),
                    work.getGridHeight(), work.getCanvasWidth(), work.getCanvasHeight(),
                    work.getPublishedTime(), work.getCreateTime());
        }
    }

    public record VersionVO(Long id, Integer versionNumber, Long creatorId, String creator,
                            String description, LocalDateTime createTime, Integer width, Integer height) { }

    public record CanvasVO(String pixelData) { }

    public record VersionDetailVO(Long id, Integer versionNumber, String pixelData) { }

    public record ContributorVO(Long userId, String username, String avatar, long pixelCount) { }
}
