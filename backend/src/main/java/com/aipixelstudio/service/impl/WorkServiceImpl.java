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

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class WorkServiceImpl implements WorkService {
    private static final int MAX_HISTORY_RECORDS = 500;
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
        if (workId == null) {
            work = new Work();
            work.setUserId(userId);
            work.setCreateTime(LocalDateTime.now());
        } else {
            work = findOwnedWork(userId, workId);
        }
        work.setTitle(request.getTitle() == null || request.getTitle().isBlank() ? "未命名像素作品" : request.getTitle().trim());
        work.setPixelSize(request.getSize());
        work.setPixelData(json(request.getPixelData()));
        work.setUpdateTime(LocalDateTime.now());
        if (work.getId() == null) workMapper.insert(work); else workMapper.updateById(work);

        // The client sends only the active branch. Replacing rows hides abandoned branches atomically.
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

    private LocalDateTime operationDateTime(String operationTime) {
        if (operationTime == null || operationTime.isBlank()) return LocalDateTime.now();
        try { return LocalDateTime.now().with(LocalTime.parse(operationTime, DateTimeFormatter.ofPattern("HH:mm:ss"))); }
        catch (RuntimeException exception) { return LocalDateTime.now(); }
    }
}
