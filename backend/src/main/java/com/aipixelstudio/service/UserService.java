package com.aipixelstudio.service;

import com.aipixelstudio.dto.ChangePasswordDTO;
import com.aipixelstudio.dto.LoginDTO;
import com.aipixelstudio.dto.RegisterDTO;
import com.aipixelstudio.vo.LoginVO;
import com.aipixelstudio.vo.UserInfoVO;

public interface UserService {
    UserInfoVO register(RegisterDTO registerDTO);
    LoginVO login(LoginDTO loginDTO);
    UserInfoVO currentUser(Long userId);
    void changePassword(Long userId, ChangePasswordDTO request);
}
