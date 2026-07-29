package com.aipixelstudio.service.impl;

import com.aipixelstudio.dto.AdminStatisticsDTO;
import com.aipixelstudio.entity.OperationLog;
import com.aipixelstudio.entity.UploadFile;
import com.aipixelstudio.entity.User;
import com.aipixelstudio.entity.Work;
import com.aipixelstudio.mapper.AdminMapper;
import com.aipixelstudio.mapper.OperationLogMapper;
import com.aipixelstudio.mapper.UploadFileMapper;
import com.aipixelstudio.mapper.UserMapper;
import com.aipixelstudio.mapper.WorkMapper;
import com.aipixelstudio.service.AdminService;
import com.aipixelstudio.vo.AdminArtworkVO;
import com.aipixelstudio.vo.AdminFileVO;
import com.aipixelstudio.vo.AdminUserVO;
import com.aipixelstudio.vo.OperationLogVO;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@Service
public class AdminServiceImpl implements AdminService {
    private static final Path UPLOAD_DIRECTORY = Path.of("uploads").toAbsolutePath().normalize();
    private final AdminMapper adminMapper;
    private final UserMapper userMapper;
    private final WorkMapper workMapper;
    private final UploadFileMapper uploadFileMapper;
    private final OperationLogMapper operationLogMapper;

    public AdminServiceImpl(AdminMapper adminMapper, UserMapper userMapper, WorkMapper workMapper,
                            UploadFileMapper uploadFileMapper, OperationLogMapper operationLogMapper) {
        this.adminMapper = adminMapper;
        this.userMapper = userMapper;
        this.workMapper = workMapper;
        this.uploadFileMapper = uploadFileMapper;
        this.operationLogMapper = operationLogMapper;
    }

    @Override
    public AdminStatisticsDTO statistics() {
        return new AdminStatisticsDTO(userMapper.selectCount(null), workMapper.selectCount(manageableWorks()),
                adminMapper.countTodayUpload(), adminMapper.countTodayGenerate());
    }

    @Override
    public List<AdminUserVO> users() {
        return userMapper.selectList(Wrappers.<User>lambdaQuery().orderByDesc(User::getCreateTime)).stream()
                .map(user -> new AdminUserVO(user.getId(), user.getUsername(), user.getCreateTime(),
                        user.getRole() == null ? "USER" : user.getRole(), user.getStatus() == null ? 1 : user.getStatus()))
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateUserStatus(Long adminId, Long userId, Integer status) {
        ensureNotSelf(adminId, userId);
        User user = requireUser(userId);
        user.setStatus(status);
        userMapper.updateById(user);
        recordOperation(adminId, (status == 1 ? "启用用户：" : "禁用用户：") + user.getUsername());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteUser(Long adminId, Long userId) {
        ensureNotSelf(adminId, userId);
        User user = requireUser(userId);
        userMapper.deleteById(userId);
        recordOperation(adminId, "删除用户：" + user.getUsername());
    }

    @Override
    public List<AdminArtworkVO> artworks() {
        Map<Long, String> usernames = usernames();
        return workMapper.selectList(manageableWorks().orderByDesc(Work::getCreateTime)).stream()
                .map(work -> new AdminArtworkVO(work.getId(), work.getUserId(), usernames.getOrDefault(work.getUserId(), "已删除用户"),
                        work.getTitle(), work.getPixelSize(), work.getSourceImageUrl(), work.getPixelImageUrl(),
                        work.getReviewStatus(), work.getReviewNote(), work.getPublishedTime(), work.getPixelData(), work.getCreateTime(), work.getUpdateTime()))
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void reviewArtwork(Long adminId, Long artworkId, boolean approved, String reviewNote) {
        Work work = workMapper.selectById(artworkId);
        if (work == null) throw new IllegalArgumentException("Work not found");
        if (!"PENDING".equals(work.getReviewStatus())) throw new IllegalArgumentException("Work is not pending review");
        work.setReviewStatus(approved ? "PUBLISHED" : "REJECTED");
        work.setReviewNote(reviewNote == null || reviewNote.isBlank() ? null : reviewNote.trim());
        work.setReviewerId(adminId);
        work.setReviewedTime(LocalDateTime.now());
        work.setPublishedTime(approved ? LocalDateTime.now() : null);
        work.setUpdateTime(LocalDateTime.now());
        workMapper.updateById(work);
        recordOperation(adminId, (approved ? "Approved work: " : "Rejected work: ") + work.getTitle() + " (ID=" + artworkId + ")");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteArtwork(Long adminId, Long artworkId) {
        Work work = workMapper.selectById(artworkId);
        if (work == null) throw new IllegalArgumentException("作品不存在");
        workMapper.deleteById(artworkId);
        recordOperation(adminId, "删除作品：" + work.getTitle() + "（ID=" + artworkId + "）");
    }

    @Override
    public List<AdminFileVO> files() {
        Map<Long, String> usernames = usernames();
        List<UploadFile> records = uploadFileMapper.selectList(Wrappers.<UploadFile>lambdaQuery().orderByDesc(UploadFile::getCreateTime));
        List<AdminFileVO> result = new ArrayList<>();
        Map<String, UploadFile> recordedFiles = new HashMap<>();
        for (UploadFile file : records) {
            recordedFiles.put(file.getStoredName(), file);
            if (Files.isRegularFile(safePath(file.getStoredName()))) result.add(new AdminFileVO(file.getId(), file.getStoredName(), file.getOriginalName(), file.getFileSize(),
                    file.getFileType(), usernames.getOrDefault(file.getUserId(), "已删除用户"), file.getCreateTime(), "/uploads/" + file.getStoredName()));
        }
        if (Files.isDirectory(UPLOAD_DIRECTORY)) try (Stream<Path> paths = Files.list(UPLOAD_DIRECTORY)) {
            paths.filter(Files::isRegularFile).forEach(path -> {
                String name = path.getFileName().toString();
                if (recordedFiles.containsKey(name)) return;
                try { result.add(new AdminFileVO(null, name, name, Files.size(path), "LEGACY", "历史文件",
                        LocalDateTime.ofInstant(Files.getLastModifiedTime(path).toInstant(), ZoneId.systemDefault()), "/uploads/" + name)); }
                catch (IOException ignored) { }
            });
        } catch (IOException ignored) { }
        result.sort(Comparator.comparing(AdminFileVO::createTime, Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteFile(Long adminId, Long fileId) {
        UploadFile file = uploadFileMapper.selectById(fileId);
        if (file == null) throw new IllegalArgumentException("文件不存在");
        Path path = safePath(file.getStoredName());
        try { Files.deleteIfExists(path); }
        catch (IOException exception) { throw new IllegalArgumentException("文件删除失败"); }
        uploadFileMapper.deleteById(fileId);
        recordOperation(adminId, "删除文件：" + file.getOriginalName());
    }

    @Override
    public void deleteFileByName(Long adminId, String fileName) {
        Path path = safePath(fileName);
        try { if (!Files.deleteIfExists(path)) throw new IllegalArgumentException("文件不存在"); }
        catch (IOException exception) { throw new IllegalArgumentException("文件删除失败"); }
        recordOperation(adminId, "删除历史文件：" + fileName);
    }

    @Override
    public List<OperationLogVO> logs() {
        Map<Long, String> usernames = usernames();
        return operationLogMapper.selectList(Wrappers.<OperationLog>lambdaQuery().orderByDesc(OperationLog::getCreateTime)).stream()
                .map(log -> new OperationLogVO(log.getId(), log.getUserId(), usernames.getOrDefault(log.getUserId(), "已删除用户"),
                        log.getOperation(), log.getCreateTime())).toList();
    }

    @Override
    public void recordOperation(Long adminId, String operation) {
        OperationLog log = new OperationLog();
        log.setUserId(adminId);
        log.setOperation(operation);
        log.setCreateTime(LocalDateTime.now());
        operationLogMapper.insert(log);
    }

    private User requireUser(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new IllegalArgumentException("用户不存在");
        return user;
    }

    private void ensureNotSelf(Long adminId, Long targetId) {
        if (adminId.equals(targetId)) throw new IllegalArgumentException("不能修改或删除当前登录管理员");
    }

    private Map<Long, String> usernames() {
        Map<Long, String> result = new HashMap<>();
        userMapper.selectList(null).forEach(user -> result.put(user.getId(), user.getUsername()));
        return result;
    }

    /** Drafts are private author work and must never enter the administration queue. */
    private com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Work> manageableWorks() {
        return Wrappers.<Work>lambdaQuery().in(Work::getReviewStatus, "PENDING", "PUBLISHED", "REJECTED");
    }

    private Path safePath(String filename) {
        Path path = UPLOAD_DIRECTORY.resolve(filename).normalize();
        if (!path.getParent().equals(UPLOAD_DIRECTORY)) throw new IllegalArgumentException("非法文件名");
        return path;
    }
}
