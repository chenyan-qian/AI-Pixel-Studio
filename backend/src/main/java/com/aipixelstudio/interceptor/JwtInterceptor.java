package com.aipixelstudio.interceptor;

import com.aipixelstudio.common.Result;
import com.aipixelstudio.entity.User;
import com.aipixelstudio.mapper.UserMapper;
import com.aipixelstudio.utils.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

/** Validates JWTs, exposes their identity on the request, and protects /admin/**. */
@Component
public class JwtInterceptor implements HandlerInterceptor {
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;
    private final UserMapper userMapper;

    public JwtInterceptor(JwtUtil jwtUtil, ObjectMapper objectMapper, UserMapper userMapper) {
        this.jwtUtil = jwtUtil;
        this.objectMapper = objectMapper;
        this.userMapper = userMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) return true;

        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ") || !jwtUtil.validateToken(authorization.substring(7))) {
            return reject(response, HttpServletResponse.SC_UNAUTHORIZED, "Token invalid or expired");
        }

        Claims claims = jwtUtil.parseToken(authorization.substring(7));
        Long userId = Long.valueOf(claims.getSubject());
        User user = userMapper.selectById(userId);
        // Checking current status makes a newly disabled account lose access immediately.
        if (user == null || !Integer.valueOf(1).equals(user.getStatus())) {
            return reject(response, HttpServletResponse.SC_FORBIDDEN, "Account is disabled or unavailable");
        }

        String role = user.getRole() == null ? "USER" : user.getRole();
        if (request.getRequestURI().startsWith("/admin/") && !"ADMIN".equals(role)) {
            return reject(response, HttpServletResponse.SC_FORBIDDEN, "Administrator permission required");
        }

        request.setAttribute("userId", userId);
        request.setAttribute("username", user.getUsername());
        request.setAttribute("role", role);
        return true;
    }

    private boolean reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(Result.fail(status, message)));
        return false;
    }
}
