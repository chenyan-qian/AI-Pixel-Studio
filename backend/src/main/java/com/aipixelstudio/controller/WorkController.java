package com.aipixelstudio.controller;

import com.aipixelstudio.common.Result;
import com.aipixelstudio.dto.WorkSaveDTO;
import com.aipixelstudio.dto.ArtworkPermissionDTO;
import com.aipixelstudio.entity.ArtworkPermission;
import com.aipixelstudio.service.CollaborationService;
import com.aipixelstudio.entity.Work;
import com.aipixelstudio.service.WorkService;
import com.aipixelstudio.vo.WorkSaveVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Work ownership is taken only from the authenticated request, never from client input. */
@RestController
@RequestMapping("/api/work")
public class WorkController {
    private final WorkService workService;
    private final CollaborationService collaborationService;

    public WorkController(WorkService workService, CollaborationService collaborationService) {
        this.workService = workService;
        this.collaborationService = collaborationService;
    }

    @PostMapping("/create")
    public Result<WorkSaveVO> create(@Valid @RequestBody WorkSaveDTO request, HttpServletRequest servletRequest) {
        return Result.success(workService.save(currentUserId(servletRequest), null, request));
    }

    /** Used by the editor Save control after automatic creation. */
    @PutMapping("/{workId}")
    public Result<WorkSaveVO> update(@PathVariable Long workId, @Valid @RequestBody WorkSaveDTO request, HttpServletRequest servletRequest) {
        return Result.success(workService.save(currentUserId(servletRequest), workId, request));
    }

    @PostMapping("/{workId}/submit")
    public Result<Void> submit(@PathVariable Long workId, HttpServletRequest servletRequest) {
        workService.submitForReview(currentUserId(servletRequest), workId);
        return Result.success(null);
    }

    @PostMapping("/{workId}/unpublish")
    public Result<Void> unpublish(@PathVariable Long workId, HttpServletRequest servletRequest) {
        workService.unpublish(currentUserId(servletRequest), workId);
        return Result.success(null);
    }

    @PutMapping("/{workId}/permission")
    public Result<ArtworkPermission> permission(@PathVariable Long workId, @Valid @RequestBody ArtworkPermissionDTO request, HttpServletRequest servletRequest) {
        return Result.success(collaborationService.updatePermission(currentUserId(servletRequest), workId, request.getVisibility(), request.getAllowEdit(), request.getAllowComment(), request.getAllowFork()));
    }

    @GetMapping("/my")
    public Result<List<Work>> my(HttpServletRequest servletRequest) {
        return Result.success(workService.myWorks(currentUserId(servletRequest)));
    }

    @GetMapping("/{workId}")
    public Result<Work> detail(@PathVariable Long workId, HttpServletRequest servletRequest) {
        return Result.success(workService.detail(currentUserId(servletRequest), workId));
    }

    @DeleteMapping("/{workId}")
    public Result<Void> delete(@PathVariable Long workId, HttpServletRequest servletRequest) {
        workService.delete(currentUserId(servletRequest), workId);
        return Result.success(null);
    }

    private Long currentUserId(HttpServletRequest request) {
        return (Long) request.getAttribute("userId");
    }
}
