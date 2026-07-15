package com.aipixelstudio.service;

import com.aipixelstudio.dto.LoginDTO;
import com.aipixelstudio.vo.LoginVO;

public interface UserService {
    void register(LoginDTO registerDTO);
    LoginVO login(LoginDTO loginDTO);
}
