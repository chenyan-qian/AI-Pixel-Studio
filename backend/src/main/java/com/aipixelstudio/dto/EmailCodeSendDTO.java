package com.aipixelstudio.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class EmailCodeSendDTO {
    @NotBlank(message = "请输入邮箱地址")
    @Email(message = "邮箱格式不正确，请检查后重试")
    @Size(max = 254, message = "邮箱地址过长，请检查后重试")
    private String email;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
