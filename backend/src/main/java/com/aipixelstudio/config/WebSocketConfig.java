package com.aipixelstudio.config;

import com.aipixelstudio.websocket.ArtworkWebSocketHandler;
import com.aipixelstudio.websocket.JwtHandshakeInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final ArtworkWebSocketHandler handler;
    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;
    public WebSocketConfig(ArtworkWebSocketHandler handler, JwtHandshakeInterceptor jwtHandshakeInterceptor) {
        this.handler = handler; this.jwtHandshakeInterceptor = jwtHandshakeInterceptor;
    }
    @Override public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws/artwork/{artworkId}").addInterceptors(jwtHandshakeInterceptor)
                .setAllowedOrigins("http://localhost:3000", "http://127.0.0.1:3000");
    }
}
