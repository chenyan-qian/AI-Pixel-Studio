package com.aipixelstudio.service;

import com.aipixelstudio.dto.AdminStatisticsDTO;
import com.aipixelstudio.vo.AdminArtworkVO;
import com.aipixelstudio.vo.AdminFileVO;
import com.aipixelstudio.vo.AdminUserVO;
import com.aipixelstudio.vo.OperationLogVO;
import java.util.List;

public interface AdminService {
    AdminStatisticsDTO statistics();
    List<AdminUserVO> users();
    void updateUserStatus(Long adminId, Long userId, Integer status);
    void deleteUser(Long adminId, Long userId);
    List<AdminArtworkVO> artworks();
    void reviewArtwork(Long adminId, Long artworkId, boolean approved, String reviewNote);
    void deleteArtwork(Long adminId, Long artworkId);
    List<AdminFileVO> files();
    void deleteFile(Long adminId, Long fileId);
    void deleteFileByName(Long adminId, String fileName);
    List<OperationLogVO> logs();
    void recordOperation(Long adminId, String operation);
}
