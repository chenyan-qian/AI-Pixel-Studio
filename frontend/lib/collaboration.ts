import { getToken } from "@/lib/auth";
import { usePixelEditorStore, type PixelGrid, type PixelOverrideMatrix, type SoftnessMatrix } from "@/lib/pixel-editor-store";

export interface CollaborationUser { userId?: number; username: string; key?: string; }
export interface RenderedCollaborationUser extends CollaborationUser { key: string; }
export interface PixelChange { x: number; y: number; color: string; softness: number; overridden: boolean; }
export interface CollaborationVersion { id?: number; versionNumber: number; description: string; creatorId: number; createTime: string; }
export interface CollaborationEvent {
  type: "ROOM_STATE" | "CANVAS_STATE" | "PIXEL_UPDATE" | "PIXEL_BATCH" | "VERSION_SAVED" | "CURSOR_UPDATE";
  onlineUsers?: CollaborationUser[];
  currentVersion?: number;
  userId?: number;
  username?: string;
  x?: number;
  y?: number;
  color?: string;
  softness?: number;
  overridden?: boolean;
  pixelGrid?: PixelGrid;
  pixelSoftness?: SoftnessMatrix;
  pixelOverrides?: PixelOverrideMatrix;
  changes?: PixelChange[];
  version?: CollaborationVersion;
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

export function applyRemotePixelUpdates(event: CollaborationEvent) {
  const changes = event.changes || (typeof event.x === "number" && typeof event.y === "number" && event.color
    ? [{ x: event.x, y: event.y, color: event.color, softness: event.softness ?? 0, overridden: event.overridden ?? true }]
    : []);
  if (!changes.length) return;
  const state = usePixelEditorStore.getState();
  const pixels = state.pixelGrid.map((row) => [...row]);
  const softness = state.pixelSoftness.map((row) => [...row]);
  const overrides = state.pixelOverrides.map((row) => [...row]);
  let applied = 0;
  changes.forEach((change) => {
    if (!pixels[change.y] || pixels[change.y][change.x] === undefined) return;
    pixels[change.y][change.x] = change.color;
    softness[change.y][change.x] = change.softness ?? 0;
    overrides[change.y][change.x] = change.overridden ?? true;
    applied += 1;
  });
  if (applied) state.replaceCollaborationGrid(pixels, softness, overrides);
}

/** Applies the room's current image when a collaborator joins after earlier edits were made. */
export function applyRemoteCanvasState(event: CollaborationEvent) {
  if (!Array.isArray(event.pixelGrid) || !Array.isArray(event.pixelSoftness) || !Array.isArray(event.pixelOverrides)) return;
  const state = usePixelEditorStore.getState();
  if (event.pixelGrid.length !== state.gridHeight || event.pixelGrid.some((row) => !Array.isArray(row) || row.length !== state.gridWidth)) return;
  state.replaceCollaborationGrid(event.pixelGrid, event.pixelSoftness, event.pixelOverrides);
}
