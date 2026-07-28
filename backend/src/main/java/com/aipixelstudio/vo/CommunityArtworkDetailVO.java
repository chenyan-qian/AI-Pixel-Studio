package com.aipixelstudio.vo;

import com.aipixelstudio.entity.ArtworkPermission;
import com.aipixelstudio.entity.ArtworkVersion;
import com.aipixelstudio.entity.Work;
import java.util.List;

public record CommunityArtworkDetailVO(
        Work artwork, String username, String avatar, ArtworkPermission permission,
        int onlineCount, long modificationCount, List<ArtworkVersion> versions, List<ContributorVO> contributors
) {
    public record ContributorVO(Long userId, String username, String avatar, long pixelCount) { }
}
