import { getToken } from "@/lib/auth";
import { usePixelEditorStore } from "@/lib/pixel-editor-store";

export interface CollaborationUser { userId?: number; username: string; key?: string; }
export interface RenderedCollaborationUser extends CollaborationUser { key: string; }
export interface PixelChange { x: number; y: number; color: string; softness: number; overridden: boolean; }
export interface CollaborationEvent {
  type: "ROOM_STATE" | "PIXEL_UPDATE" | "CURSOR_UPDATE";
  onlineUsers?: CollaborationUser[];
  currentVersion?: number;
  userId?: number;
  username?: string;
  x?: number;
  y?: number;
  color?: string;
  softness?: number;
  overridden?: boolean;
}

export const LOCAL_PIXEL_CHANGE_EVENT = "pixelverse:local-pixel-changes";

function clientUuid() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** A person can hold several sockets; the room UI renders one entry per user. */
export function normalizeOnlineUsers(users: CollaborationUser[]): RenderedCollaborationUser[] {
  const keys = new Set<string>();
  return users.flatMap((user) => {
    const key = typeof user.userId === "number" ? `user-${user.userId}` : `guest-${clientUuid()}`;
    if (keys.has(key)) return [];
    keys.add(key);
    return [{ ...user, key }];
  });
}

export function emitLocalPixelChanges(changes: PixelChange[]) {
  if (typeof window !== "undefined" && changes.length) window.dispatchEvent(new CustomEvent<PixelChange[]>(LOCAL_PIXEL_CHANGE_EVENT, { detail: changes }));
}

export function collaborationSocketUrl(artworkId: number) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  return `${base.replace(/^http/, "ws")}/ws/artwork/${artworkId}?token=${encodeURIComponent(getToken() || "")}`;
}

export function applyRemotePixelUpdate(event: CollaborationEvent) {
  if (typeof event.x !== "number" || typeof event.y !== "number" || !event.color) return;
  const state = usePixelEditorStore.getState();
  if (!state.pixelGrid[event.y] || state.pixelGrid[event.y][event.x] === undefined) return;
  const pixels = state.pixelGrid.map((row) => [...row]);
  const softness = state.pixelSoftness.map((row) => [...row]);
  const overrides = state.pixelOverrides.map((row) => [...row]);
  pixels[event.y][event.x] = event.color;
  softness[event.y][event.x] = event.softness ?? 0;
  overrides[event.y][event.x] = event.overridden ?? true;
  state.commitPixelGrid(pixels, softness, overrides, { action: "pixel_change", description: `${event.username || "Collaborator"} edited (${event.x}, ${event.y})` });
}
