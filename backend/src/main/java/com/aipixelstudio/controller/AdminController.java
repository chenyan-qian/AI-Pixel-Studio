package com.aipixelstudio.controller;

import com.aipixelstudio.common.Result;
import com.aipixelstudio.dto.AdminStatisticsDTO;
import com.aipixelstudio.dto.UserStatusDTO;
import com.aipixelstudio.dto.WorkReviewDTO;
import com.aipixelstudio.service.AdminService;
import com.aipixelstudio.vo.AdminArtworkVO;
import com.aipixelstudio.vo.AdminFileVO;
import com.aipixelstudio.vo.AdminUserVO;
import com.aipixelstudio.vo.OperationLogVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

/** All endpoints are protected by JwtInterceptor's ADMIN check. */
@RestController
@RequestMapping("/admin")
public class AdminController {
    private final AdminService adminService;
    public AdminController(AdminService adminService) { this.adminService = adminService; }

    @GetMapping("/statistics") public Result<AdminStatisticsDTO> statistics() { return Result.success(adminService.statistics()); }
    @GetMapping("/users") public Result<List<AdminUserVO>> users() { return Result.success(adminService.users()); }
    @PutMapping("/user/status")
    public Result<Void> updateUserStatus(@Valid @RequestBody UserStatusDTO request, HttpServletRequest servletRequest) {
        adminService.updateUserStatus(currentUserId(servletRequest), request.getId(), request.getStatus());
        return Result.success("用户状态已更新", null);
    }
    @DeleteMapping("/user/{id}")
    public Result<Void> deleteUser(@PathVariable Long id, HttpServletRequest servletRequest) {
        adminService.deleteUser(currentUserId(servletRequest), id); return Result.success("用户已删除", null);
    }
    @GetMapping("/artworks") public Result<List<AdminArtworkVO>> artworks() { return Result.success(adminService.artworks()); }
    @PutMapping("/artwork/{id}/review")
    public Result<Void> reviewArtwork(@PathVariable Long id, @Valid @RequestBody WorkReviewDTO request, HttpServletRequest servletRequest) {
        adminService.reviewArtwork(currentUserId(servletRequest), id, request.getApproved(), request.getReviewNote());
        return Result.success(null);
    }
    @DeleteMapping("/artwork/{id}")
    public Result<Void> deleteArtwork(@PathVariable Long id, HttpServletRequest servletRequest) {
        adminService.deleteArtwork(currentUserId(servletRequest), id); return Result.success("作品已删除", null);
    }
    @GetMapping("/files") public Result<List<AdminFileVO>> files() { return Result.success(adminService.files()); }
    @DeleteMapping("/file/{id}")
    public Result<Void> deleteFile(@PathVariable Long id, HttpServletRequest servletRequest) {
        adminService.deleteFile(currentUserId(servletRequest), id); return Result.success("文件已删除", null);
    }
    @DeleteMapping("/file")
    public Result<Void> deleteLegacyFile(@RequestParam String fileName, HttpServletRequest servletRequest) {
        adminService.deleteFileByName(currentUserId(servletRequest), fileName); return Result.success("文件已删除", null);
    }
    @GetMapping("/logs") public Result<List<OperationLogVO>> logs() { return Result.success(adminService.logs()); }
    private Long currentUserId(HttpServletRequest request) { return (Long) request.getAttribute("userId"); }
}
