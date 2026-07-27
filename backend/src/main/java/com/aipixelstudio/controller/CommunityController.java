package com.aipixelstudio.controller;

import com.aipixelstudio.common.Result;
import com.aipixelstudio.service.WorkService;
import com.aipixelstudio.vo.CommunityWorkVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public gallery intentionally exposes approved works only. */
@RestController
@RequestMapping("/api/community")
public class CommunityController {
    private final WorkService workService;

    public CommunityController(WorkService workService) { this.workService = workService; }

    @GetMapping("/works")
    public Result<List<CommunityWorkVO>> works() {
        List<CommunityWorkVO> works = workService.publishedWorks().stream()
                .map(work -> new CommunityWorkVO(work.getId(), work.getTitle(), work.getSourceImageUrl(),
                        work.getPixelImageUrl(), work.getPixelSize(), work.getImageWidth(), work.getImageHeight(), work.getPublishedTime()))
                .toList();
        return Result.success(works);
    }
}
