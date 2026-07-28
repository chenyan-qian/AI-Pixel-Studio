package com.aipixelstudio.controller;

import com.aipixelstudio.common.Result;
import com.aipixelstudio.entity.User;
import com.aipixelstudio.mapper.UserMapper;
import com.aipixelstudio.service.WorkService;
import com.aipixelstudio.vo.CommunityWorkVO;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    public CommunityController(WorkService workService, UserMapper userMapper) {
        this.workService = workService;
        this.userMapper = userMapper;
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
                            0, 0, work.getPublishedTime() != null ? work.getPublishedTime() : work.getCreateTime());
                })
                .toList();
        return Result.success(works);
    }
}
