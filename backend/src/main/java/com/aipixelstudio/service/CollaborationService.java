package com.aipixelstudio.service;

import com.aipixelstudio.entity.ArtworkPermission;
import com.aipixelstudio.entity.ArtworkCollaborationRoom;
import com.aipixelstudio.entity.ArtworkVersion;
import com.aipixelstudio.entity.PixelOperation;
import com.aipixelstudio.entity.Work;
import com.aipixelstudio.mapper.ArtworkPermissionMapper;
import com.aipixelstudio.mapper.ArtworkCollaborationRoomMapper;
import com.aipixelstudio.mapper.ArtworkVersionMapper;
import com.aipixelstudio.mapper.PixelOperationMapper;
import com.aipixelstudio.mapper.WorkMapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class CollaborationService {
    private final ArtworkPermissionMapper permissionMapper;
    private final ArtworkCollaborationRoomMapper roomMapper;
    private final PixelOperationMapper operationMapper;
    private final ArtworkVersionMapper versionMapper;
    private final WorkMapper workMapper;
    private final ObjectMapper objectMapper;
    private final ConcurrentMap<Long, Integer> onlineCounts = new ConcurrentHashMap<>();

    public CollaborationService(ArtworkPermissionMapper permissionMapper, ArtworkCollaborationRoomMapper roomMapper, PixelOperationMapper operationMapper,
                                ArtworkVersionMapper versionMapper, WorkMapper workMapper, ObjectMapper objectMapper) {
        this.permissionMapper = permissionMapper; this.roomMapper = roomMapper;
        this.operationMapper = operationMapper;
        this.versionMapper = versionMapper;
        this.workMapper = workMapper;
        this.objectMapper = objectMapper;
    }

    public ArtworkPermission permissionFor(Long artworkId) {
        ArtworkPermission permission = permissionMapper.selectById(artworkId);
        if (permission != null) return permission;
        ArtworkPermission fallback = new ArtworkPermission();
        fallback.setArtworkId(artworkId);
        fallback.setVisibility("PUBLIC");
        fallback.setAllowEdit(false);
        fallback.setAllowComment(true);
        fallback.setAllowFork(true);
        return fallback;
    }

    public boolean canCollaborate(Long artworkId) {
        ArtworkPermission permission = permissionFor(artworkId);
        return "PUBLIC_COLLAB".equals(permission.getVisibility()) && Boolean.TRUE.equals(permission.getAllowEdit());
    }

    @Transactional
    public ArtworkPermission updatePermission(Long userId, Long artworkId, String visibility, Boolean allowEdit, Boolean allowComment, Boolean allowFork) {
        Work work = workMapper.selectById(artworkId);
        if (work == null || !userId.equals(work.getUserId())) throw new IllegalArgumentException("Artwork not found or access denied");
        if (!("PRIVATE".equals(visibility) || "PUBLIC".equals(visibility) || "PUBLIC_COLLAB".equals(visibility))) throw new IllegalArgumentException("Invalid visibility");
        ArtworkPermission permission = permissionFor(artworkId);
        permission.setVisibility(visibility);
        permission.setAllowEdit("PUBLIC_COLLAB".equals(visibility) && Boolean.TRUE.equals(allowEdit));
        permission.setAllowComment(allowComment == null || allowComment);
        permission.setAllowFork(allowFork == null || allowFork);
        if (permissionMapper.selectById(artworkId) == null) permissionMapper.insert(permission); else permissionMapper.updateById(permission);
        return permission;
    }

    public long operationCount(Long artworkId) {
        return operationMapper.selectCount(Wrappers.<PixelOperation>lambdaQuery().eq(PixelOperation::getArtworkId, artworkId));
    }

    public int onlineCount(Long artworkId) { return onlineCounts.getOrDefault(artworkId, 0); }
    public void setOnlineCount(Long artworkId, int count) {
        if (count <= 0) onlineCounts.remove(artworkId); else onlineCounts.put(artworkId, count);
        ArtworkCollaborationRoom room = roomMapper.selectOne(Wrappers.<ArtworkCollaborationRoom>lambdaQuery().eq(ArtworkCollaborationRoom::getArtworkId, artworkId));
        if (room == null) { room = new ArtworkCollaborationRoom(); room.setArtworkId(artworkId); room.setCreatedTime(LocalDateTime.now()); room.setOnlineCount(count); roomMapper.insert(room); }
        else { room.setOnlineCount(count); roomMapper.updateById(room); }
    }

    public List<PixelOperation> operations(Long artworkId) {
        return operationMapper.selectList(Wrappers.<PixelOperation>lambdaQuery().eq(PixelOperation::getArtworkId, artworkId).orderByDesc(PixelOperation::getCreateTime).last("LIMIT 100"));
    }

    public List<ArtworkVersion> versions(Long artworkId) {
        return versionMapper.selectList(Wrappers.<ArtworkVersion>lambdaQuery()
                .select(ArtworkVersion::getId, ArtworkVersion::getArtworkId, ArtworkVersion::getVersionNumber,
                        ArtworkVersion::getCreatorId, ArtworkVersion::getDescription, ArtworkVersion::getCreateTime)
                .eq(ArtworkVersion::getArtworkId, artworkId)
                .orderByDesc(ArtworkVersion::getVersionNumber));
    }

    public void recordOperation(Long artworkId, Long userId, int x, int y, String oldColor, String newColor) {
        PixelOperation operation = new PixelOperation();
        operation.setArtworkId(artworkId); operation.setUserId(userId); operation.setX(x); operation.setY(y);
        operation.setOldColor(oldColor); operation.setNewColor(newColor); operation.setCreateTime(LocalDateTime.now());
        operationMapper.insert(operation);
    }

    public void recordOperations(List<PixelOperation> operations) {
        if (!operations.isEmpty()) operationMapper.insertBatch(operations);
    }

    @Transactional
    public ArtworkVersion saveVersion(Long artworkId, Long userId, String snapshot, String description) {
        Work work = workMapper.selectById(artworkId);
        if (work == null || !canCollaborate(artworkId)) throw new IllegalArgumentException("Collaboration is unavailable");
        validateSnapshot(snapshot, work);
        Integer latest = versionMapper.selectList(Wrappers.<ArtworkVersion>lambdaQuery().eq(ArtworkVersion::getArtworkId, artworkId).orderByDesc(ArtworkVersion::getVersionNumber).last("LIMIT 1"))
                .stream().findFirst().map(ArtworkVersion::getVersionNumber).orElse(0);
        ArtworkVersion version = new ArtworkVersion();
        version.setArtworkId(artworkId); version.setVersionNumber(latest + 1); version.setSnapshotUrl(snapshot);
        version.setCreatorId(userId); version.setDescription(description == null || description.isBlank() ? "Collaborative update" : description.trim());
        version.setCreateTime(LocalDateTime.now());
        versionMapper.insert(version);
        work.setPixelData(snapshot); workMapper.updateById(work);
        return version;
    }

    @Transactional
    public ArtworkVersion restoreVersion(Long artworkId, Long versionNumber, Long userId) {
        Work work = workMapper.selectById(artworkId);
        if (work == null || !canCollaborate(artworkId)) throw new IllegalArgumentException("Collaboration is unavailable");
        ArtworkVersion source = versionMapper.selectOne(Wrappers.<ArtworkVersion>lambdaQuery().eq(ArtworkVersion::getArtworkId, artworkId).eq(ArtworkVersion::getVersionNumber, versionNumber));
        if (source == null) throw new IllegalArgumentException("Version not found");
        validateSnapshot(source.getSnapshotUrl(), work);
        // Restoring selects an existing checkpoint; it must not create another timeline entry.
        work.setPixelData(source.getSnapshotUrl());
        workMapper.updateById(work);
        return source;
    }

    private void validateSnapshot(String snapshot, Work work) {
        try {
            JsonNode grid = objectMapper.readTree(snapshot).path("pixelGrid");
            if (!grid.isArray() || grid.size() != work.getGridHeight() || grid.isEmpty() || grid.get(0).size() != work.getGridWidth()) throw new IllegalArgumentException("Snapshot dimensions do not match artwork");
        } catch (Exception exception) {
            if (exception instanceof IllegalArgumentException invalid) throw invalid;
            throw new IllegalArgumentException("Invalid snapshot");
        }
    }
}
