package com.aipixelstudio.controller;

import com.aipixelstudio.common.Result;
import com.aipixelstudio.dto.EmailCodeSendDTO;
import com.aipixelstudio.service.EmailCodeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/email")
public class EmailController {
    private final EmailCodeService emailCodeService;

    public EmailController(EmailCodeService emailCodeService) {
        this.emailCodeService = emailCodeService;
    }

    @PostMapping("/send")
    public Result<Void> send(@Valid @RequestBody EmailCodeSendDTO request) {
        emailCodeService.sendRegistrationCode(request.getEmail());
        return Result.success("验证码已发送", null);
    }
}
