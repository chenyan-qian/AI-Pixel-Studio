package com.aipixelstudio.service.impl;

import com.aipixelstudio.dto.HistoryRecordSaveDTO;
import com.aipixelstudio.dto.WorkSaveDTO;
import com.aipixelstudio.entity.Work;
import com.aipixelstudio.entity.WorkHistory;
import com.aipixelstudio.mapper.WorkHistoryMapper;
import com.aipixelstudio.mapper.WorkMapper;
import com.aipixelstudio.service.WorkService;
import com.aipixelstudio.vo.WorkSaveVO;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class WorkServiceImpl implements WorkService {
    /** 即使前端绕过快照压缩策略，也限制一次保存可携带的历史记录数量。 */
    private static final int MAX_HISTORY_RECORDS = 500;
    private static final Path UPLOAD_DIRECTORY = Path.of("uploads").toAbsolutePath().normalize();
    private final WorkMapper workMapper;
    private final WorkHistoryMapper workHistoryMapper;
    private final ObjectMapper objectMapper;

    public WorkServiceImpl(WorkMapper workMapper, WorkHistoryMapper workHistoryMapper, ObjectMapper objectMapper) {
        this.workMapper = workMapper;
        this.workHistoryMapper = workHistoryMapper;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public WorkSaveVO save(Long userId, Long workId, WorkSaveDTO request) {
        validate(request);
        Work work;
        // 只有当前登录用户自己的作品，才允许按指定 id 覆盖保存。
        if (workId == null) {
            work = new Work();
            work.setUserId(userId);
            work.setCreateTime(LocalDateTime.now());
            work.setReviewStatus("DRAFT");
        } else {
            work = findOwnedWork(userId, workId);
            // Any saved edit invalidates a prior review decision and must be reviewed again.
            if ("PUBLISHED".equals(work.getReviewStatus()) || "PENDING".equals(work.getReviewStatus())) {
                work.setReviewStatus("DRAFT");
                work.setReviewNote(null);
                work.setReviewerId(null);
                work.setReviewedTime(null);
                work.setPublishedTime(null);
            }
        }
        work.setTitle(request.getTitle() == null || request.getTitle().isBlank() ? "未命名像素作品" : request.getTitle().trim());
        work.setPixelSize(request.getSize());
        if (request.getSourceImageUrl() != null && !request.getSourceImageUrl().isBlank()) work.setSourceImageUrl(request.getSourceImageUrl());
        work.setImageWidth(request.getImageWidth());
        work.setImageHeight(request.getImageHeight());
        work.setGridWidth(request.getGridWidth());
        work.setGridHeight(request.getGridHeight());
        work.setCanvasWidth(request.getCanvasWidth());
        work.setCanvasHeight(request.getCanvasHeight());
        work.setPixelData(json(request.getPixelData()));
        work.setUpdateTime(LocalDateTime.now());
        if (work.getId() == null) {
            workMapper.insert(work);
        }
        work.setPixelImageUrl(savePixelPreview(work, request.getPixelData()));
        workMapper.updateById(work);

        // 前端只提交当前活动分支，直接整批替换可一次性隐藏已废弃的旧分支。
        workHistoryMapper.delete(Wrappers.<WorkHistory>lambdaQuery().eq(WorkHistory::getWorkId, work.getId()).eq(WorkHistory::getUserId, userId));
        for (HistoryRecordSaveDTO record : request.getHistory()) {
            WorkHistory history = new WorkHistory();
            history.setWorkId(work.getId());
            history.setUserId(userId);
            history.setOperationNo(record.getId());
            history.setOperationType(record.getOperationType());
            history.setOperationDesc(record.getOperationDesc());
            history.setPixelData(record.getPixelData() == null || record.getPixelData().isNull() ? null : json(record.getPixelData()));
            history.setSoftnessData(record.getSoftnessData() == null || record.getSoftnessData().isNull() ? null : json(record.getSoftnessData()));
            history.setCompressedSnapshot(record.getCompressedSnapshot());
            history.setCreateTime(operationDateTime(record.getOperationTime()));
            workHistoryMapper.insert(history);
        }
        return new WorkSaveVO(work.getId());
    }

    @Override
    public Work detail(Long userId, Long workId) {
        return findOwnedWork(userId, workId);
    }

    @Override
    public List<Work> myWorks(Long userId) {
        return workMapper.selectList(Wrappers.<Work>lambdaQuery()
                .eq(Work::getUserId, userId)
                .orderByDesc(Work::getUpdateTime));
    }

    @Override
    @Transactional
    public void submitForReview(Long userId, Long workId) {
        Work work = findOwnedWork(userId, workId);
        if ("PENDING".equals(work.getReviewStatus())) throw new IllegalArgumentException("Work is already pending review");
        work.setReviewStatus("PENDING");
        work.setReviewNote(null);
        work.setReviewerId(null);
        work.setReviewedTime(null);
        work.setPublishedTime(null);
        work.setUpdateTime(LocalDateTime.now());
        workMapper.updateById(work);
    }

    @Override
    public List<Work> publishedWorks() {
        return workMapper.selectList(Wrappers.<Work>lambdaQuery()
                .eq(Work::getReviewStatus, "PUBLISHED")
                .orderByDesc(Work::getPublishedTime));
    }

    @Override
    @Transactional
    public void delete(Long userId, Long workId) {
        findOwnedWork(userId, workId);
        workHistoryMapper.delete(Wrappers.<WorkHistory>lambdaQuery()
                .eq(WorkHistory::getWorkId, workId)
                .eq(WorkHistory::getUserId, userId));
        workMapper.deleteById(workId);
    }

    @Override
    public List<WorkHistory> history(Long userId, Long workId) {
        findOwnedWork(userId, workId);
        return workHistoryMapper.selectList(Wrappers.<WorkHistory>lambdaQuery()
                .eq(WorkHistory::getWorkId, workId).eq(WorkHistory::getUserId, userId)
                .orderByDesc(WorkHistory::getOperationNo));
    }

    private Work findOwnedWork(Long userId, Long workId) {
        Work work = workMapper.selectOne(Wrappers.<Work>lambdaQuery().eq(Work::getId, workId).eq(Work::getUserId, userId));
        if (work == null) throw new IllegalArgumentException("作品不存在或无权访问");
        return work;
    }

    private void validate(WorkSaveDTO request) {
        if (request.getImageWidth() == null || request.getImageWidth() <= 0 || request.getImageHeight() == null || request.getImageHeight() <= 0
                || request.getGridWidth() == null || request.getGridWidth() <= 0 || request.getGridHeight() == null || request.getGridHeight() <= 0
                || request.getCanvasWidth() == null || request.getCanvasWidth() <= 0 || request.getCanvasHeight() == null || request.getCanvasHeight() <= 0) {
            throw new IllegalArgumentException("Invalid image dimensions");
        }
        if (request.getSize() == null || request.getSize() <= 0 || request.getSize() > 256) throw new IllegalArgumentException("像素尺寸不合法");
        if (request.getHistory() == null || request.getHistory().isEmpty() || request.getHistory().size() > MAX_HISTORY_RECORDS) throw new IllegalArgumentException("历史记录数量不合法");
        for (HistoryRecordSaveDTO record : request.getHistory()) {
            if (record.getId() == null || record.getId() < 1 || record.getOperationType() == null || record.getOperationDesc() == null) throw new IllegalArgumentException("历史记录内容不完整");
            if (record.getPixelData() == null && (record.getCompressedSnapshot() == null || record.getCompressedSnapshot().isBlank())) throw new IllegalArgumentException("历史记录缺少快照");
        }
    }

    private String json(JsonNode value) {
        try { return objectMapper.writeValueAsString(value); }
        catch (JsonProcessingException exception) { throw new IllegalArgumentException("像素数据格式不正确"); }
    }

    /** Generates a durable preview for work cards directly from the saved grid. */
    private String savePixelPreview(Work work, JsonNode pixelData) {
        JsonNode grid = pixelData.path("pixelGrid");
        if (!grid.isArray()) throw new IllegalArgumentException("Pixel grid is missing");
        BufferedImage image = new BufferedImage(work.getCanvasWidth(), work.getCanvasHeight(), BufferedImage.TYPE_INT_ARGB);
        Graphics2D graphics = image.createGraphics();
        try {
            for (int row = 0; row < Math.min(work.getGridHeight(), grid.size()); row++) {
                JsonNode columns = grid.get(row);
                if (!columns.isArray()) continue;
                for (int column = 0; column < Math.min(work.getGridWidth(), columns.size()); column++) {
                    String color = columns.get(column).asText("transparent");
                    if ("transparent".equalsIgnoreCase(color) || !color.matches("#[0-9a-fA-F]{6}")) continue;
                    graphics.setColor(Color.decode(color));
                    graphics.fillRect(column * work.getPixelSize(), row * work.getPixelSize(), work.getPixelSize(), work.getPixelSize());
                }
            }
            Files.createDirectories(UPLOAD_DIRECTORY);
            String fileName = "work-" + work.getId() + ".png";
            if (!ImageIO.write(image, "png", UPLOAD_DIRECTORY.resolve(fileName).toFile())) throw new IOException("PNG encoder unavailable");
            return "/uploads/" + fileName;
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to save pixel preview", exception);
        } finally {
            graphics.dispose();
        }
    }

    private LocalDateTime operationDateTime(String operationTime) {
        // 前端只传时分秒，这里补上当天日期后再写入数据库。
        if (operationTime == null || operationTime.isBlank()) return LocalDateTime.now();
        try { return LocalDateTime.now().with(LocalTime.parse(operationTime, DateTimeFormatter.ofPattern("HH:mm:ss"))); }
        catch (RuntimeException exception) { return LocalDateTime.now(); }
    }
}
