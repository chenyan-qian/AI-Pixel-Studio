package com.aipixelstudio.websocket;

import com.aipixelstudio.entity.Work;
import com.aipixelstudio.entity.PixelOperation;
import com.aipixelstudio.entity.ArtworkVersion;
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
        sendCanvasState(session, artworkId, room);
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
        if ("HISTORY_COMMIT".equals(type)) {
            String description = event.path("history").path("description").asText("").trim();
            if (description.isEmpty() || description.length() > 300) return;
            broadcastHistoryCommit(room, artworkId, description, session.getId());
            return;
        }
        JsonNode changes;
        if ("PIXEL_UPDATE".equals(type)) changes = objectMapper.createArrayNode().add(event);
        else if ("PIXEL_BATCH".equals(type) && event.path("changes").isArray()) changes = event.path("changes");
        else return;
        List<Map<String, Object>> pendingPayloads = new ArrayList<>();
        List<PixelOperation> pendingOperations = new ArrayList<>();
        synchronized (room) {
            applyChanges(room, changes, artworkId, userId(session), pendingPayloads, pendingOperations);
        }
        if (pendingPayloads.isEmpty()) return;
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "PIXEL_BATCH"); payload.put("artworkId", artworkId); payload.put("userId", userId(session));
        payload.put("username", username(session)); payload.put("changes", pendingPayloads);
        broadcast(room, payload, session.getId());
        collaborationService.recordOperations(pendingOperations);
    }

    private void applyChanges(Room room, JsonNode changes, Long artworkId, Long userId, List<Map<String, Object>> payloads, List<PixelOperation> operations) {
        payloads.clear(); operations.clear();
        for (int index = 0; index < Math.min(changes.size(), 1024); index++) {
            JsonNode change = changes.get(index);
            int x = change.path("x").asInt(-1), y = change.path("y").asInt(-1);
            String color = change.path("color").asText();
            if (x < 0 || y < 0 || x >= room.width || y >= room.height || !isColor(color)) continue;
            String normalizedColor = "transparent".equals(color) ? "transparent" : color.toUpperCase();
            int softness = Math.max(0, Math.min(100, change.path("softness").asInt(0)));
            boolean overridden = change.path("overridden").asBoolean(true);
            String oldColor = room.colors[y][x]; room.colors[y][x] = normalizedColor;
            room.softness[y][x] = softness; room.overrides[y][x] = overridden;
            payloads.add(Map.of("x", x, "y", y, "color", normalizedColor, "softness", softness, "overridden", overridden));
            PixelOperation operation = new PixelOperation();
            operation.setArtworkId(artworkId); operation.setUserId(userId); operation.setX(x); operation.setY(y);
            operation.setOldColor(oldColor); operation.setNewColor(normalizedColor); operation.setCreateTime(java.time.LocalDateTime.now());
            operations.add(operation);
        }
    }

    @Override public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long artworkId = artworkId(session); if (artworkId == null) return;
        Room room = rooms.get(artworkId); if (room == null) return;
        room.sessions.remove(session.getId());
        collaborationService.setOnlineCount(artworkId, room.sessions.size());
        if (room.sessions.isEmpty()) rooms.remove(artworkId, room); else broadcastRoomState(room, artworkId);
    }

    public int onlineCount(Long artworkId) { Room room = rooms.get(artworkId); return room == null ? 0 : room.sessions.size(); }

    /** Publishes newly saved checkpoints so every open timeline shows the same list. */
    public void broadcastVersionSaved(Long artworkId, ArtworkVersion version) {
        Room room = rooms.get(artworkId);
        if (room == null) return;
        Map<String, Object> versionPayload = new LinkedHashMap<>();
        versionPayload.put("id", version.getId()); versionPayload.put("versionNumber", version.getVersionNumber());
        versionPayload.put("description", version.getDescription()); versionPayload.put("creatorId", version.getCreatorId());
        versionPayload.put("createTime", version.getCreateTime() == null ? null : version.getCreateTime().toString());
        try { broadcast(room, Map.of("type", "VERSION_SAVED", "artworkId", artworkId, "version", versionPayload), null); }
        catch (IOException exception) { throw new IllegalStateException("Unable to broadcast saved version", exception); }
    }

    /** Adds one shared timeline record after a collaborator finishes a stroke. */
    public void broadcastHistoryCommit(Long artworkId, String description) {
        Room room = rooms.get(artworkId);
        if (room == null) return;
        try { broadcastHistoryCommit(room, artworkId, description, null); }
        catch (IOException exception) { throw new IllegalStateException("Unable to broadcast collaboration history", exception); }
    }
    private void broadcastHistoryCommit(Room room, Long artworkId, String description, String excludedSessionId) throws IOException {
        Map<String, Object> history = Map.of("action", "pixel_change", "description", description);
        broadcast(room, Map.of("type", "HISTORY_COMMIT", "artworkId", artworkId, "history", history), excludedSessionId);
    }

    /** Replaces the authoritative in-memory room canvas after a version is restored, then publishes it to every member. */
    public void replaceCanvasFromVersion(Long artworkId, String snapshot) {
        Room room = rooms.get(artworkId);
        if (room == null) return;
        Room restored = Room.from(snapshot, objectMapper);
        if (restored.width != room.width || restored.height != room.height) throw new IllegalArgumentException("Restored version dimensions do not match the collaboration room");
        synchronized (room) {
            for (int y = 0; y < room.height; y++) {
                System.arraycopy(restored.colors[y], 0, room.colors[y], 0, room.width);
                System.arraycopy(restored.softness[y], 0, room.softness[y], 0, room.width);
                System.arraycopy(restored.overrides[y], 0, room.overrides[y], 0, room.width);
            }
        }
        try { broadcastCanvasState(room, artworkId); }
        catch (IOException exception) { throw new IllegalStateException("Unable to broadcast restored canvas", exception); }
    }

    private void broadcastRoomState(Room room, Long artworkId) throws IOException {
        Map<Long, Map<String, Object>> usersById = new LinkedHashMap<>();
        for (WebSocketSession member : room.sessions.values()) {
            Long memberId = userId(member);
            usersById.putIfAbsent(memberId, Map.of("userId", memberId, "username", username(member)));
        }
        broadcast(room, Map.of("type", "ROOM_STATE", "artworkId", artworkId, "onlineUsers", new ArrayList<>(usersById.values()), "currentVersion", collaborationService.versions(artworkId).size()), null);
    }
    private void sendCanvasState(WebSocketSession session, Long artworkId, Room room) throws IOException {
        if (session.isOpen()) session.sendMessage(new TextMessage(objectMapper.writeValueAsString(canvasStatePayload(room, artworkId))));
    }
    private void broadcastCanvasState(Room room, Long artworkId) throws IOException {
        broadcast(room, canvasStatePayload(room, artworkId), null);
    }
    private Map<String, Object> canvasStatePayload(Room room, Long artworkId) {
        Map<String, Object> payload = new LinkedHashMap<>();
        synchronized (room) {
            payload.put("type", "CANVAS_STATE"); payload.put("artworkId", artworkId);
            payload.put("pixelGrid", copy(room.colors)); payload.put("pixelSoftness", copy(room.softness)); payload.put("pixelOverrides", copy(room.overrides));
        }
        return payload;
    }
    private String[][] copy(String[][] source) { String[][] copy = new String[source.length][]; for (int row = 0; row < source.length; row++) copy[row] = source[row].clone(); return copy; }
    private int[][] copy(int[][] source) { int[][] copy = new int[source.length][]; for (int row = 0; row < source.length; row++) copy[row] = source[row].clone(); return copy; }
    private boolean[][] copy(boolean[][] source) { boolean[][] copy = new boolean[source.length][]; for (int row = 0; row < source.length; row++) copy[row] = source[row].clone(); return copy; }
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
        final int width; final int height; final String[][] colors; final int[][] softness; final boolean[][] overrides;
        final ConcurrentMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
        private Room(int width, int height, String[][] colors, int[][] softness, boolean[][] overrides) {
            this.width = width; this.height = height; this.colors = colors; this.softness = softness; this.overrides = overrides;
        }
        static Room from(String pixelData, ObjectMapper mapper) {
            try {
                JsonNode saved = mapper.readTree(pixelData);
                JsonNode grid = saved.path("pixelGrid"), softnessData = saved.path("pixelSoftness"), overrideData = saved.path("pixelOverrides");
                int height = grid.size(), width = height == 0 ? 0 : grid.get(0).size();
                String[][] colors = new String[height][width]; int[][] softness = new int[height][width]; boolean[][] overrides = new boolean[height][width];
                for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
                    colors[y][x] = grid.path(y).path(x).asText("transparent");
                    softness[y][x] = Math.max(0, Math.min(100, softnessData.path(y).path(x).asInt(0)));
                    overrides[y][x] = overrideData.path(y).path(x).asBoolean(false);
                }
                return new Room(width, height, colors, softness, overrides);
            } catch (Exception exception) { return new Room(0, 0, new String[0][0], new int[0][0], new boolean[0][0]); }
        }
    }
}
