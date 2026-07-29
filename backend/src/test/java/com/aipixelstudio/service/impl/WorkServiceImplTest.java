package com.aipixelstudio.service.impl;

import com.aipixelstudio.entity.ArtworkPermission;
import com.aipixelstudio.entity.Work;
import com.aipixelstudio.mapper.ArtworkPermissionMapper;
import com.aipixelstudio.mapper.WorkHistoryMapper;
import com.aipixelstudio.mapper.WorkMapper;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WorkServiceImplTest {
    @Test
    void unpublishingReturnsTheOwnersWorkToPrivateDraft() {
        WorkMapper workMapper = mock(WorkMapper.class);
        WorkHistoryMapper historyMapper = mock(WorkHistoryMapper.class);
        ArtworkPermissionMapper permissionMapper = mock(ArtworkPermissionMapper.class);
        WorkServiceImpl service = new WorkServiceImpl(workMapper, historyMapper, permissionMapper, new ObjectMapper());

        Work work = new Work();
        work.setId(9L);
        work.setUserId(7L);
        work.setReviewStatus("PUBLISHED");
        work.setPublishedTime(java.time.LocalDateTime.now());
        ArtworkPermission permission = new ArtworkPermission();
        permission.setArtworkId(9L);
        permission.setVisibility("PUBLIC_COLLAB");
        permission.setAllowEdit(true);
        permission.setAllowComment(true);
        permission.setAllowFork(true);
        when(workMapper.selectOne(any(Wrapper.class))).thenReturn(work);
        when(permissionMapper.selectById(9L)).thenReturn(permission);

        service.unpublish(7L, 9L);

        assertEquals("DRAFT", work.getReviewStatus());
        assertNull(work.getPublishedTime());
        assertEquals("PRIVATE", permission.getVisibility());
        assertFalse(permission.getAllowEdit());
        assertFalse(permission.getAllowComment());
        assertFalse(permission.getAllowFork());
        verify(workMapper).updateById(work);
        verify(permissionMapper).updateById(permission);
    }
}
