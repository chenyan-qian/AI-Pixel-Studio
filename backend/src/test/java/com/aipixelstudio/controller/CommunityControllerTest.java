package com.aipixelstudio.controller;

import com.aipixelstudio.entity.ArtworkVersion;
import com.aipixelstudio.entity.User;
import com.aipixelstudio.entity.Work;
import com.aipixelstudio.mapper.ArtworkVersionMapper;
import com.aipixelstudio.mapper.UserMapper;
import com.aipixelstudio.mapper.WorkMapper;
import com.aipixelstudio.service.CollaborationService;
import com.aipixelstudio.service.WorkService;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class CommunityControllerTest {
    private final WorkService workService = mock(WorkService.class);
    private final UserMapper userMapper = mock(UserMapper.class);
    private final CollaborationService collaborationService = mock(CollaborationService.class);
    private final WorkMapper workMapper = mock(WorkMapper.class);
    private final ArtworkVersionMapper versionMapper = mock(ArtworkVersionMapper.class);
    private CommunityController controller;

    @BeforeEach
    void setUp() {
        MapperBuilderAssistant builder = new MapperBuilderAssistant(new MybatisConfiguration(), "community-test");
        TableInfoHelper.initTableInfo(builder, Work.class);
        TableInfoHelper.initTableInfo(builder, ArtworkVersion.class);
        TableInfoHelper.initTableInfo(builder, User.class);
        controller = new CommunityController(workService, userMapper, collaborationService, workMapper, versionMapper);
    }

    @Test
    void detailContainsVersionMetadataButNoCanvasOrSnapshot() throws Exception {
        Work work = work();
        work.setPixelData("current-canvas-data");
        when(workMapper.selectOne(any())).thenReturn(work);
        ArtworkVersion version = version();
        version.setSnapshotUrl("historical-canvas-data");
        when(collaborationService.versions(5L)).thenReturn(List.of(version));
        when(collaborationService.operations(5L)).thenReturn(List.of());
        User author = new User();
        author.setId(2L);
        author.setUsername("author");
        when(userMapper.selectList(any())).thenReturn(List.of(author));

        var detail = controller.detail(5L).getData();
        String json = new ObjectMapper().findAndRegisterModules().writeValueAsString(detail);

        assertEquals(1, detail.versions().size());
        assertEquals(3, detail.latestVersion().versionNumber());
        assertEquals("author", detail.versions().get(0).creator());
        assertFalse(json.contains("pixelData"));
        assertFalse(json.contains("snapshotUrl"));
        assertFalse(json.contains("current-canvas-data"));
        assertFalse(json.contains("historical-canvas-data"));
        verify(versionMapper, never()).selectOne(any());
    }

    @Test
    void selectedVersionLoadsItsSnapshot() {
        when(workMapper.selectOne(any())).thenReturn(work());
        when(versionMapper.selectOne(any())).thenReturn(version());

        var detail = controller.version(5L, 12L).getData();

        assertEquals(12L, detail.id());
        assertEquals("historical-canvas-data", detail.pixelData());
    }

    @Test
    void unpublishedArtworkCannotExposeVersionSnapshot() {
        when(workMapper.selectOne(any())).thenReturn(null);

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> controller.version(4L, 12L));

        assertTrue(error.getMessage().contains("Artwork not found"));
        verifyNoInteractions(versionMapper);
    }

    @Test
    void currentCanvasIsLoadedSeparately() {
        when(workMapper.selectOne(any())).thenReturn(work());

        assertEquals("current-canvas-data", controller.canvas(5L).getData().pixelData());
        verifyNoInteractions(versionMapper);
    }

    private Work work() {
        Work work = new Work();
        work.setId(5L);
        work.setUserId(2L);
        work.setTitle("Artwork");
        work.setGridWidth(8);
        work.setGridHeight(8);
        work.setPixelData("current-canvas-data");
        work.setReviewStatus("PUBLISHED");
        return work;
    }

    private ArtworkVersion version() {
        ArtworkVersion version = new ArtworkVersion();
        version.setId(12L);
        version.setArtworkId(5L);
        version.setCreatorId(2L);
        version.setVersionNumber(3);
        version.setDescription("Saved version");
        version.setSnapshotUrl("historical-canvas-data");
        return version;
    }
}
