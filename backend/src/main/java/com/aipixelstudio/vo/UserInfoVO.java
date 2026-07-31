package com.aipixelstudio.vo;

import com.aipixelstudio.entity.User;

/** Public profile returned for the user identified by the request token. */
public class UserInfoVO {
    private Long id;
    private String username;
    private String email;
    private Integer emailVerified;
    private String nickname;
    private String avatar;
    private String role;

    public static UserInfoVO from(User user) {
        UserInfoVO info = new UserInfoVO();
        info.id = user.getId();
        info.username = user.getUsername();
        info.email = user.getEmail();
        info.emailVerified = user.getEmailVerified();
        info.nickname = user.getNickname();
        info.avatar = user.getAvatar();
        info.role = user.getRole() == null ? "USER" : user.getRole();
        return info;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public Integer getEmailVerified() { return emailVerified; }
    public String getNickname() { return nickname; }
    public String getAvatar() { return avatar; }
    public String getRole() { return role; }
}
