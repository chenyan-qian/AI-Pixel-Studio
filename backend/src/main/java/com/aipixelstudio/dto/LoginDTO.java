package com.aipixelstudio.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoginDTO {
    @NotBlank(message = "Email is required")
    @Email(message = "Email format is invalid")
    @Size(max = 254, message = "Email is too long")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 64, message = "Password must be 6-64 characters")
    private String password;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
