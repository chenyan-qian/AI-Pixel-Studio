package com.aipixelstudio.service;

import com.aipixelstudio.dto.WorkSaveDTO;
import com.aipixelstudio.entity.Work;
import com.aipixelstudio.entity.WorkHistory;
import com.aipixelstudio.vo.WorkSaveVO;

import java.util.List;

public interface WorkService {
    WorkSaveVO save(Long userId, Long workId, WorkSaveDTO request);
    List<Work> myWorks(Long userId);
    Work detail(Long userId, Long workId);
    void delete(Long userId, Long workId);
    List<WorkHistory> history(Long userId, Long workId);
}
