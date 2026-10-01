package com.aipixelstudio.controller;

import com.aipixelstudio.common.Result;
import com.aipixelstudio.entity.User;
import com.aipixelstudio.entity.Work;
import com.aipixelstudio.entity.ArtworkVersion;
import com.aipixelstudio.entity.PixelOperation;
import com.aipixelstudio.mapper.ArtworkVersionMapper;
import com.aipixelstudio.mapper.UserMapper;
import com.aipixelstudio.mapper.WorkMapper;
import com.aipixelstudio.service.CollaborationService;
import com.aipixelstudio.service.WorkService;
import com.aipixelstudio.vo.CommunityArtworkDetailVO;
import com.aipixelstudio.vo.CommunityWorkVO;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Public gallery intentionally exposes approved works only. */
@RestController
@RequestMapping("/api/community")
public class CommunityController {
    private final WorkService workService;
    private final UserMapper userMapper;
    private final CollaborationService collaborationService;
    private final WorkMapper workMapper;
    private final ArtworkVersionMapper versionMapper;

    public CommunityController(WorkService workService, UserMapper userMapper, CollaborationService collaborationService,
                               WorkMapper workMapper, ArtworkVersionMapper versionMapper) {
        this.workService = workService;
        this.userMapper = userMapper;
        this.collaborationService = collaborationService;
        this.workMapper = workMapper;
        this.versionMapper = versionMapper;
    }

    @GetMapping({"/artworks", "/works"})
    public Result<List<CommunityWorkVO>> artworks() {
        var publishedWorks = workService.publishedWorks();
        Map<Long, User> usersById = publishedWorks.isEmpty() ? Map.of() : userMapper.selectList(Wrappers.<User>lambdaQuery()
                        .select(User::getId, User::getUsername, User::getAvatar)
                        .in(User::getId, publishedWorks.stream().map(work -> work.getUserId()).distinct().toList()))
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<CommunityWorkVO> works = publishedWorks.stream()
                .map(work -> {
                    User user = usersById.get(work.getUserId());
                    return new CommunityWorkVO(work.getId(), work.getTitle(),
                            work.getPixelImageUrl() != null ? work.getPixelImageUrl() : work.getSourceImageUrl(),
                            user == null ? "PixelVerse Creator" : user.getUsername(),
                            user == null ? null : user.getAvatar(),
                            work.getPixelSize(), work.getImageWidth(), work.getImageHeight(),
                            0, 0, work.getPublishedTime() != null ? work.getPublishedTime() : work.getCreateTime(),
                            collaborationService.canCollaborate(work.getId()), collaborationService.onlineCount(work.getId()), collaborationService.operationCount(work.getId()));
                })
                .toList();
        return Result.success(works);
    }

    @GetMapping("/artworks/{workId}")
    public Result<CommunityArtworkDetailVO> detail(@PathVariable Long workId) {
        Work work = publishedArtwork(workId);
        List<ArtworkVersion> versions = collaborationService.versions(workId);
        List<PixelOperation> operations = collaborationService.operations(workId);
        Set<Long> userIds = new HashSet<>();
        userIds.add(work.getUserId());
        versions.forEach(version -> userIds.add(version.getCreatorId()));
        operations.forEach(operation -> userIds.add(operation.getUserId()));
        Map<Long, User> users = userMapper.selectList(Wrappers.<User>lambdaQuery()
                        .select(User::getId, User::getUsername, User::getAvatar).in(User::getId, userIds))
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        User author = users.get(work.getUserId());
        Map<Long, Long> contributionCounts = operations.stream()
                .collect(Collectors.groupingBy(operation -> operation.getUserId(), Collectors.counting()));
        List<CommunityArtworkDetailVO.ContributorVO> contributors = contributionCounts.entrySet().stream().map(entry -> {
            User contributor = users.get(entry.getKey());
            return new CommunityArtworkDetailVO.ContributorVO(entry.getKey(), contributor == null ? "PixelVerse user" : contributor.getUsername(), contributor == null ? null : contributor.getAvatar(), entry.getValue());
        }).toList();
        List<CommunityArtworkDetailVO.VersionVO> versionSummaries = versions.stream().map(version -> {
            User creator = users.get(version.getCreatorId());
            return new CommunityArtworkDetailVO.VersionVO(version.getId(), version.getVersionNumber(),
                    version.getCreatorId(), creator == null ? "PixelVerse user" : creator.getUsername(),
                    version.getDescription(), version.getCreateTime(), work.getGridWidth(), work.getGridHeight());
        }).toList();
        return Result.success(new CommunityArtworkDetailVO(CommunityArtworkDetailVO.ArtworkVO.from(work),
                author == null ? "PixelVerse Creator" : author.getUsername(), author == null ? null : author.getAvatar(),
                collaborationService.permissionFor(workId), collaborationService.onlineCount(workId),
                collaborationService.operationCount(workId), versionSummaries.isEmpty() ? null : versionSummaries.get(0),
                versionSummaries, contributors));
    }

    @GetMapping("/artworks/{workId}/canvas")
    public Result<CommunityArtworkDetailVO.CanvasVO> canvas(@PathVariable Long workId) {
        Work work = workMapper.selectOne(Wrappers.<Work>lambdaQuery()
                .select(Work::getPixelData).eq(Work::getId, workId).eq(Work::getReviewStatus, "PUBLISHED"));
        if (work == null) throw new IllegalArgumentException("Artwork not found");
        return Result.success(new CommunityArtworkDetailVO.CanvasVO(work.getPixelData()));
    }

    @GetMapping("/artworks/{workId}/versions/{versionId}")
    public Result<CommunityArtworkDetailVO.VersionDetailVO> version(@PathVariable Long workId, @PathVariable Long versionId) {
        Work published = workMapper.selectOne(Wrappers.<Work>lambdaQuery()
                .select(Work::getId).eq(Work::getId, workId).eq(Work::getReviewStatus, "PUBLISHED"));
        if (published == null) throw new IllegalArgumentException("Artwork not found");
        ArtworkVersion version = versionMapper.selectOne(Wrappers.<ArtworkVersion>lambdaQuery()
                .select(ArtworkVersion::getId, ArtworkVersion::getVersionNumber, ArtworkVersion::getSnapshotUrl)
                .eq(ArtworkVersion::getId, versionId).eq(ArtworkVersion::getArtworkId, workId));
        if (version == null) throw new IllegalArgumentException("Version not found");
        return Result.success(new CommunityArtworkDetailVO.VersionDetailVO(version.getId(),
                version.getVersionNumber(), version.getSnapshotUrl()));
    }

    private Work publishedArtwork(Long workId) {
        Work work = workMapper.selectOne(Wrappers.<Work>lambdaQuery()
                .select(Work::getId, Work::getUserId, Work::getTitle, Work::getSourceImageUrl,
                        Work::getPixelImageUrl, Work::getPixelSize, Work::getImageWidth, Work::getImageHeight,
                        Work::getGridWidth, Work::getGridHeight, Work::getCanvasWidth, Work::getCanvasHeight,
                        Work::getPublishedTime, Work::getCreateTime)
                .eq(Work::getId, workId).eq(Work::getReviewStatus, "PUBLISHED"));
        if (work == null) throw new IllegalArgumentException("Artwork not found");
        return work;
    }
}
