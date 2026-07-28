package com.aipixelstudio.controller;

import com.aipixelstudio.common.Result;
import com.aipixelstudio.entity.User;
import com.aipixelstudio.entity.Work;
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

    public CommunityController(WorkService workService, UserMapper userMapper, CollaborationService collaborationService, WorkMapper workMapper) {
        this.workService = workService;
        this.userMapper = userMapper;
        this.collaborationService = collaborationService;
        this.workMapper = workMapper;
    }

    @GetMapping({"/artworks", "/works"})
    public Result<List<CommunityWorkVO>> artworks() {
        var publishedWorks = workService.publishedWorks();
        Map<Long, User> usersById = publishedWorks.isEmpty() ? Map.of() : userMapper.selectList(Wrappers.<User>lambdaQuery()
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
        Work work = workMapper.selectById(workId);
        if (work == null || !"PUBLISHED".equals(work.getReviewStatus())) throw new IllegalArgumentException("Artwork not found");
        User author = userMapper.selectById(work.getUserId());
        Map<Long, User> users = collaborationService.operations(workId).stream().map(operation -> operation.getUserId()).distinct()
                .map(userMapper::selectById).filter(java.util.Objects::nonNull).collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, Long> contributionCounts = collaborationService.operations(workId).stream()
                .collect(Collectors.groupingBy(operation -> operation.getUserId(), Collectors.counting()));
        List<CommunityArtworkDetailVO.ContributorVO> contributors = contributionCounts.entrySet().stream().map(entry -> {
            User contributor = users.get(entry.getKey());
            return new CommunityArtworkDetailVO.ContributorVO(entry.getKey(), contributor == null ? "PixelVerse user" : contributor.getUsername(), contributor == null ? null : contributor.getAvatar(), entry.getValue());
        }).toList();
        return Result.success(new CommunityArtworkDetailVO(work, author == null ? "PixelVerse Creator" : author.getUsername(), author == null ? null : author.getAvatar(),
                collaborationService.permissionFor(workId), collaborationService.onlineCount(workId), collaborationService.operationCount(workId), collaborationService.versions(workId), contributors));
    }
}
