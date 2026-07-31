package com.aipixelstudio.service.impl;

import com.aipixelstudio.entity.EmailCode;
import com.aipixelstudio.entity.User;
import com.aipixelstudio.mapper.EmailCodeMapper;
import com.aipixelstudio.mapper.UserMapper;
import com.aipixelstudio.service.EmailCodeService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Locale;

@Service
public class EmailCodeServiceImpl implements EmailCodeService {
    private static final int CODE_EXPIRE_MINUTES = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_SENDS_PER_DAY = 10;

    private final EmailCodeMapper emailCodeMapper;
    private final UserMapper userMapper;
    private final JavaMailSender mailSender;
    private final String from;
    private final SecureRandom secureRandom = new SecureRandom();

    public EmailCodeServiceImpl(EmailCodeMapper emailCodeMapper, UserMapper userMapper, JavaMailSender mailSender,
                                @Value("${mail.from}") String from) {
        this.emailCodeMapper = emailCodeMapper;
        this.userMapper = userMapper;
        this.mailSender = mailSender;
        this.from = from;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void sendRegistrationCode(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        if (findUserByEmail(email) != null) {
            throw new IllegalArgumentException("该邮箱已注册，请直接登录");
        }

        LocalDateTime now = LocalDateTime.now();
        EmailCode latestCode = emailCodeMapper.selectOne(new LambdaQueryWrapper<EmailCode>()
                .eq(EmailCode::getEmail, email)
                .orderByDesc(EmailCode::getCreateTime)
                .last("LIMIT 1"));
        if (latestCode != null && latestCode.getCreateTime().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(now)) {
            throw new IllegalArgumentException("请 60 秒后再获取验证码");
        }

        long sentToday = emailCodeMapper.selectCount(new LambdaQueryWrapper<EmailCode>()
                .eq(EmailCode::getEmail, email)
                .ge(EmailCode::getCreateTime, now.toLocalDate().atStartOfDay())
                .lt(EmailCode::getCreateTime, now.toLocalDate().atTime(LocalTime.MAX)));
        if (sentToday >= MAX_SENDS_PER_DAY) {
            throw new IllegalArgumentException("今日验证码发送次数已达上限，请明天再试");
        }

        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        emailCodeMapper.invalidateUnusedByEmail(email);
        EmailCode emailCode = new EmailCode();
        emailCode.setEmail(email);
        emailCode.setCode(code);
        emailCode.setExpireTime(now.plusMinutes(CODE_EXPIRE_MINUTES));
        emailCode.setUsed(0);
        emailCode.setCreateTime(now);
        emailCodeMapper.insert(emailCode);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("PixelVerse registration verification code");
        message.setText("Your PixelVerse verification code is " + code + ". It expires in 5 minutes. Do not share it with anyone.");
        try {
            mailSender.send(message);
        } catch (MailException exception) {
            throw new IllegalArgumentException("邮箱地址不正确或邮件发送失败，请检查邮箱后重试");
        }
    }

    private User findUserByEmail(String email) {
        return userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getEmail, email));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
