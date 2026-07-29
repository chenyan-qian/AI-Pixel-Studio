package com.aipixelstudio.interceptor;

import com.aipixelstudio.entity.User;
import com.aipixelstudio.mapper.UserMapper;
import com.aipixelstudio.utils.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtInterceptorIsolationTest {
    private static final String SECRET = "multi-user-authentication-test-secret-key-2026";

    @Test
    void keepsTwoAuthenticatedRequestsBoundToTheirOwnUserIds() throws Exception {
        JwtUtil jwtUtil = new JwtUtil(SECRET, 60_000);
        String tokenA = jwtUtil.generateToken(101L);
        String tokenB = jwtUtil.generateToken(202L);

        assertTrue(!tokenA.equals(tokenB));
        assertNull(jwtUtil.parseToken(tokenA).get("username"));
        assertNull(jwtUtil.parseToken(tokenA).get("role"));

        UserMapper userMapper = mock(UserMapper.class);
        when(userMapper.selectById(101L)).thenReturn(activeUser(101L, "account-a"));
        when(userMapper.selectById(202L)).thenReturn(activeUser(202L, "account-b"));
        JwtInterceptor interceptor = new JwtInterceptor(jwtUtil, new ObjectMapper(), userMapper);

        MockHttpServletRequest requestA = authorizedRequest(tokenA);
        MockHttpServletRequest requestB = authorizedRequest(tokenB);

        assertTrue(interceptor.preHandle(requestA, new MockHttpServletResponse(), new Object()));
        assertTrue(interceptor.preHandle(requestB, new MockHttpServletResponse(), new Object()));
        assertEquals(101L, requestA.getAttribute("userId"));
        assertEquals("account-a", requestA.getAttribute("username"));
        assertEquals(202L, requestB.getAttribute("userId"));
        assertEquals("account-b", requestB.getAttribute("username"));
    }

    private MockHttpServletRequest authorizedRequest(String token) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/work/my");
        request.addHeader("Authorization", "Bearer " + token);
        return request;
    }

    private User activeUser(Long id, String username) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setRole("USER");
        user.setStatus(1);
        return user;
    }
}
