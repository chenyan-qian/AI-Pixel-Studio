package com.aipixelstudio.controller;

import com.aipixelstudio.common.Result;
import com.aipixelstudio.dto.CollaborationVersionDTO;
import com.aipixelstudio.entity.ArtworkVersion;
import com.aipixelstudio.service.CollaborationService;
import com.aipixelstudio.websocket.ArtworkWebSocketHandler;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/collaboration")
public class CollaborationController {
    private final CollaborationService collaborationService;
    private final ArtworkWebSocketHandler artworkWebSocketHandler;
    public CollaborationController(CollaborationService collaborationService, ArtworkWebSocketHandler artworkWebSocketHandler) {
        this.collaborationService = collaborationService; this.artworkWebSocketHandler = artworkWebSocketHandler;
    }
    @GetMapping("/{artworkId}/versions") public Result<List<ArtworkVersion>> versions(@PathVariable Long artworkId) { return Result.success(collaborationService.versions(artworkId)); }
    @PostMapping("/{artworkId}/versions") public Result<ArtworkVersion> saveVersion(@PathVariable Long artworkId, @Valid @RequestBody CollaborationVersionDTO payload, HttpServletRequest request) {
        ArtworkVersion saved = collaborationService.saveVersion(artworkId, userId(request), payload.getSnapshot(), payload.getDescription());
        artworkWebSocketHandler.broadcastVersionSaved(artworkId, saved);
        return Result.success(saved);
    }
    @PostMapping("/{artworkId}/versions/{versionNumber}/restore") public Result<ArtworkVersion> restore(@PathVariable Long artworkId, @PathVariable Long versionNumber, HttpServletRequest request) {
        ArtworkVersion restored = collaborationService.restoreVersion(artworkId, versionNumber, userId(request));
        artworkWebSocketHandler.replaceCanvasFromVersion(artworkId, restored.getSnapshotUrl());
        artworkWebSocketHandler.broadcastHistoryCommit(artworkId, "恢复版本 V" + versionNumber);
        return Result.success(restored);
    }
    private Long userId(HttpServletRequest request) { return (Long) request.getAttribute("userId"); }
}
