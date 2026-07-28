package com.aipixelstudio.websocket;

import com.aipixelstudio.utils.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;
import java.util.Map;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {
    private final JwtUtil jwtUtil;
    public JwtHandshakeInterceptor(JwtUtil jwtUtil) { this.jwtUtil = jwtUtil; }
    @Override public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler handler, Map<String, Object> attributes) {
        MultiValueMap<String, String> query = UriComponentsBuilder.fromUri(request.getURI()).build().getQueryParams();
        String token = query.getFirst("token");
        if (token == null || !jwtUtil.validateToken(token)) return false;
        Claims claims = jwtUtil.parseToken(token);
        attributes.put("userId", Long.valueOf(claims.getSubject()));
        attributes.put("username", claims.get("username", String.class));
        return true;
    }
    @Override public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler handler, Exception exception) { }
}
