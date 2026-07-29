package com.aipixelstudio.controller;

import com.aipixelstudio.common.Result;
import com.aipixelstudio.dto.ChangePasswordDTO;
import com.aipixelstudio.dto.LoginDTO;
import com.aipixelstudio.service.UserService;
import com.aipixelstudio.vo.LoginVO;
import com.aipixelstudio.vo.UserInfoVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody LoginDTO registerDTO) {
        userService.register(registerDTO);
        return Result.success("注册成功", null);
    }

    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody LoginDTO loginDTO) {
        return Result.success("登录成功", userService.login(loginDTO));
    }

    @GetMapping("/info")
    public Result<UserInfoVO> info(HttpServletRequest servletRequest) {
        return Result.success(userService.currentUser((Long) servletRequest.getAttribute("userId")));
    }

    @PutMapping("/password")
    public Result<Void> changePassword(@Valid @RequestBody ChangePasswordDTO request, HttpServletRequest servletRequest) {
        userService.changePassword((Long) servletRequest.getAttribute("userId"), request);
        return Result.success("密码修改成功", null);
    }
}
