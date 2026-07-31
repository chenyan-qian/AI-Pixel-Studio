package com.aipixelstudio.service.impl;

import com.aipixelstudio.dto.ChangePasswordDTO;
import com.aipixelstudio.dto.LoginDTO;
import com.aipixelstudio.dto.RegisterDTO;
import com.aipixelstudio.entity.EmailCode;
import com.aipixelstudio.entity.User;
import com.aipixelstudio.mapper.EmailCodeMapper;
import com.aipixelstudio.mapper.UserMapper;
import com.aipixelstudio.service.AdminService;
import com.aipixelstudio.service.UserService;
import com.aipixelstudio.utils.JwtUtil;
import com.aipixelstudio.vo.LoginVO;
import com.aipixelstudio.vo.UserInfoVO;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class UserServiceImpl implements UserService {
    private final UserMapper userMapper;
    private final EmailCodeMapper emailCodeMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AdminService adminService;

    public UserServiceImpl(UserMapper userMapper, EmailCodeMapper emailCodeMapper, PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil, AdminService adminService) {
        this.userMapper = userMapper;
        this.emailCodeMapper = emailCodeMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.adminService = adminService;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserInfoVO register(RegisterDTO registerDTO) {
        String email = normalizeEmail(registerDTO.getEmail());
        if (findByUsername(registerDTO.getUsername()) != null) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (findByEmail(email) != null) {
            throw new IllegalArgumentException("This email is already registered");
        }

        EmailCode emailCode = emailCodeMapper.selectOne(new LambdaQueryWrapper<EmailCode>()
                .eq(EmailCode::getEmail, email)
                .eq(EmailCode::getCode, registerDTO.getCode())
                .eq(EmailCode::getUsed, 0)
                .orderByDesc(EmailCode::getCreateTime)
                .last("LIMIT 1"));
        if (emailCode == null) {
            throw new IllegalArgumentException("Verification code is incorrect or has already been used");
        }
        if (!emailCode.getExpireTime().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Verification code has expired");
        }
        if (emailCodeMapper.consume(emailCode.getId()) != 1) {
            throw new IllegalArgumentException("Verification code is no longer valid");
        }

        LocalDateTime now = LocalDateTime.now();
        User user = new User();
        user.setUsername(registerDTO.getUsername().trim());
        user.setEmail(email);
        user.setEmailVerified(1);
        user.setPassword(passwordEncoder.encode(registerDTO.getPassword()));
        user.setNickname(hasText(registerDTO.getNickname()) ? registerDTO.getNickname().trim() : user.getUsername());
        user.setRole("USER");
        user.setStatus(1);
        user.setCreateTime(now);
        user.setUpdateTime(now);
        userMapper.insert(user);
        return UserInfoVO.from(user);
    }

    @Override
    public LoginVO login(LoginDTO loginDTO) {
        User user = findByEmail(normalizeEmail(loginDTO.getEmail()));
        if (user == null || !passwordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Email or password is incorrect");
        }
        if (!Integer.valueOf(1).equals(user.getEmailVerified())) {
            throw new IllegalArgumentException("Email is not verified");
        }
        if (!Integer.valueOf(1).equals(user.getStatus())) {
            throw new IllegalArgumentException("Account is disabled");
        }

        LoginVO loginVO = new LoginVO();
        String role = user.getRole() == null ? "USER" : user.getRole();
        loginVO.setToken(jwtUtil.generateToken(user.getId()));
        loginVO.setUsername(user.getUsername());
        loginVO.setNickname(user.getNickname());
        loginVO.setAvatar(user.getAvatar());
        loginVO.setRole(role);
        if ("ADMIN".equals(role)) {
            adminService.recordOperation(user.getId(), "Admin login");
        }
        return loginVO;
    }

    @Override
    public UserInfoVO currentUser(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null || !Integer.valueOf(1).equals(user.getStatus())) {
            throw new IllegalArgumentException("Account is unavailable");
        }
        return UserInfoVO.from(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void changePassword(Long userId, ChangePasswordDTO request) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User does not exist");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password must differ from the current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);
    }

    private User findByUsername(String username) {
        return userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
    }

    private User findByEmail(String email) {
        return userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getEmail, email));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
