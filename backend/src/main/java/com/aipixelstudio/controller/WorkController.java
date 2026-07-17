package com.aipixelstudio.controller;

import com.aipixelstudio.common.Result;
import com.aipixelstudio.dto.WorkSaveDTO;
import com.aipixelstudio.entity.Work;
import com.aipixelstudio.entity.WorkHistory;
import com.aipixelstudio.service.WorkService;
import com.aipixelstudio.utils.JwtUtil;
import com.aipixelstudio.vo.WorkSaveVO;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/works")
/** 作品接口统一从 JWT 中识别用户归属，不接受前端直接传 userId。 */
public class WorkController {
    private final WorkService workService;
    private final JwtUtil jwtUtil;

    public WorkController(WorkService workService, JwtUtil jwtUtil) {
        this.workService = workService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public Result<WorkSaveVO> create(@Valid @RequestBody WorkSaveDTO request, HttpServletRequest servletRequest) {
        return Result.success(workService.save(currentUserId(servletRequest), null, request));
    }

    @PutMapping("/{workId}")
    public Result<WorkSaveVO> update(@PathVariable Long workId, @Valid @RequestBody WorkSaveDTO request, HttpServletRequest servletRequest) {
        return Result.success(workService.save(currentUserId(servletRequest), workId, request));
    }

    @GetMapping("/{workId}/history")
    public Result<List<WorkHistory>> history(@PathVariable Long workId, HttpServletRequest servletRequest) {
        return Result.success(workService.history(currentUserId(servletRequest), workId));
    }

    @GetMapping("/{workId}")
    public Result<Work> detail(@PathVariable Long workId, HttpServletRequest servletRequest) {
        return Result.success(workService.detail(currentUserId(servletRequest), workId));
    }

    private Long currentUserId(HttpServletRequest request) {
        // 请求进入当前控制器前，JwtInterceptor 已完成请求头校验。
        String token = request.getHeader("Authorization").substring(7);
        Claims claims = jwtUtil.parseToken(token);
        return Long.valueOf(claims.getSubject());
    }
}
