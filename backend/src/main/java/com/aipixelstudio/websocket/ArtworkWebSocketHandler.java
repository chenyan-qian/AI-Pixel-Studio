package com.aipixelstudio.websocket;

import com.aipixelstudio.entity.Work;
import com.aipixelstudio.mapper.WorkMapper;
import com.aipixelstudio.service.CollaborationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class ArtworkWebSocketHandler extends TextWebSocketHandler {
    private final ObjectMapper objectMapper;
    private final CollaborationService collaborationService;
    private final WorkMapper workMapper;
    private final ConcurrentMap<Long, Room> rooms = new ConcurrentHashMap<>();

    public ArtworkWebSocketHandler(ObjectMapper objectMapper, CollaborationService collaborationService, WorkMapper workMapper) {
        this.objectMapper = objectMapper; this.collaborationService = collaborationService; this.workMapper = workMapper;
    }

    @Override public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long artworkId = artworkId(session);
        if (artworkId == null || !collaborationService.canCollaborate(artworkId)) { session.close(CloseStatus.POLICY_VIOLATION); return; }
        Work work = workMapper.selectById(artworkId);
        if (work == null) { session.close(CloseStatus.NOT_ACCEPTABLE); return; }
        Room room = rooms.computeIfAbsent(artworkId, ignored -> Room.from(work.getPixelData(), objectMapper));
        room.sessions.put(session.getId(), session);
        collaborationService.setOnlineCount(artworkId, room.sessions.size());
        broadcastRoomState(room, artworkId);
    }

    @Override protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Long artworkId = artworkId(session);
        Room room = artworkId == null ? null : rooms.get(artworkId);
        if (room == null) return;
        JsonNode event = objectMapper.readTree(message.getPayload());
        String type = event.path("type").asText();
        if ("CURSOR_UPDATE".equals(type)) { broadcast(room, Map.of("type", "CURSOR_UPDATE", "userId", userId(session), "username", username(session), "x", event.path("x").asInt(), "y", event.path("y").asInt()), session.getId()); return; }
        if (!"PIXEL_UPDATE".equals(type)) return;
        int x = event.path("x").asInt(-1), y = event.path("y").asInt(-1);
        String color = event.path("color").asText();
        if (x < 0 || y < 0 || x >= room.width || y >= room.height || !isColor(color)) return;
        String normalizedColor = "transparent".equals(color) ? "transparent" : color.toUpperCase();
        String oldColor;
        synchronized (room) { oldColor = room.colors[y][x]; room.colors[y][x] = normalizedColor; }
        Long userId = userId(session);
        collaborationService.recordOperation(artworkId, userId, x, y, oldColor, normalizedColor);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "PIXEL_UPDATE"); payload.put("artworkId", artworkId); payload.put("x", x); payload.put("y", y);
        payload.put("color", normalizedColor); payload.put("oldColor", oldColor); payload.put("userId", userId); payload.put("username", username(session));
        payload.put("softness", event.path("softness").asInt(0)); payload.put("overridden", event.path("overridden").asBoolean(true));
        broadcast(room, payload, session.getId());
    }

    @Override public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long artworkId = artworkId(session); if (artworkId == null) return;
        Room room = rooms.get(artworkId); if (room == null) return;
        room.sessions.remove(session.getId());
        collaborationService.setOnlineCount(artworkId, room.sessions.size());
        if (room.sessions.isEmpty()) rooms.remove(artworkId, room); else broadcastRoomState(room, artworkId);
    }

    public int onlineCount(Long artworkId) { Room room = rooms.get(artworkId); return room == null ? 0 : room.sessions.size(); }

    private void broadcastRoomState(Room room, Long artworkId) throws IOException {
        Map<Long, Map<String, Object>> usersById = new LinkedHashMap<>();
        for (WebSocketSession member : room.sessions.values()) {
            Long memberId = userId(member);
            usersById.putIfAbsent(memberId, Map.of("userId", memberId, "username", username(member)));
        }
        broadcast(room, Map.of("type", "ROOM_STATE", "artworkId", artworkId, "onlineUsers", new ArrayList<>(usersById.values()), "currentVersion", collaborationService.versions(artworkId).size()), null);
    }
    private void broadcast(Room room, Map<String, Object> payload, String excludedSessionId) throws IOException {
        TextMessage message = new TextMessage(objectMapper.writeValueAsString(payload));
        for (WebSocketSession member : room.sessions.values()) if (member.isOpen() && !member.getId().equals(excludedSessionId)) member.sendMessage(message);
    }
    private Long artworkId(WebSocketSession session) {
        Object value = session.getUri() == null ? null : org.springframework.web.util.UriComponentsBuilder.fromUri(session.getUri()).build().getQueryParams().getFirst("artworkId");
        if (value != null) try { return Long.valueOf(value.toString()); } catch (NumberFormatException ignored) { }
        String path = session.getUri() == null ? "" : session.getUri().getPath();
        String[] segments = path.split("/"); try { return Long.valueOf(segments[segments.length - 1]); } catch (RuntimeException ignored) { return null; }
    }
    private Long userId(WebSocketSession session) { return (Long) session.getAttributes().get("userId"); }
    private String username(WebSocketSession session) { Object value = session.getAttributes().get("username"); return value == null ? "PixelVerse user" : value.toString(); }
    private boolean isColor(String color) { return "transparent".equals(color) || color.matches("#[0-9a-fA-F]{6}"); }

    private static final class Room {
        final int width; final int height; final String[][] colors;
        final ConcurrentMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
        private Room(int width, int height, String[][] colors) { this.width = width; this.height = height; this.colors = colors; }
        static Room from(String pixelData, ObjectMapper mapper) {
            try {
                JsonNode grid = mapper.readTree(pixelData).path("pixelGrid");
                int height = grid.size(), width = height == 0 ? 0 : grid.get(0).size(); String[][] colors = new String[height][width];
                for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) colors[y][x] = grid.get(y).get(x).asText("transparent");
                return new Room(width, height, colors);
            } catch (Exception exception) { return new Room(0, 0, new String[0][0]); }
        }
    }
}
