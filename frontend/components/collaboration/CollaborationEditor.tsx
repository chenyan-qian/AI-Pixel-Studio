"use client";

import { Save, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import PixelEditor from "@/components/editor/PixelEditor";
import OnlineUsers from "@/components/collaboration/OnlineUsers";
import VersionTimeline, { type ArtworkVersion } from "@/components/collaboration/VersionTimeline";
import { applyRemoteCanvasState, applyRemotePixelUpdates, collaborationSocketUrl, LOCAL_PIXEL_CHANGE_EVENT, normalizeOnlineUsers, type CollaborationEvent, type PixelChange, type RenderedCollaborationUser } from "@/lib/collaboration";
import { usePixelEditorStore } from "@/lib/pixel-editor-store";
import request from "@/lib/request";

type VersionPayload = Omit<ArtworkVersion, "key">;

function uiUuid() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeVersions(versions: VersionPayload[]): ArtworkVersion[] {
  const seen = new Set<string>();
  return versions.flatMap((version) => {
    const key = typeof version.id === "number" ? `version-${version.id}` : `version-${uiUuid()}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ ...version, key }];
  });
}

export default function CollaborationEditor({ artworkId, title, author, initialVersions }: { artworkId: number; title: string; author: string; initialVersions: VersionPayload[] }) {
  const socketRef = useRef<WebSocket | null>(null);
  const [users, setUsers] = useState<RenderedCollaborationUser[]>([]);
  const [connected, setConnected] = useState(false);
  const [versions, setVersions] = useState(() => normalizeVersions(initialVersions));
  const [saveState, setSaveState] = useState("实时同步已就绪");

  useEffect(() => {
    let disposed = false;
    let retryTimer: number | null = null;
    const pendingChanges = new Map<string, PixelChange>();
    const send = (changes: PixelChange[]) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        changes.forEach((change) => pendingChanges.set(`${change.x}:${change.y}`, change));
        return false;
      }
      socket.send(JSON.stringify({ type: "PIXEL_BATCH", artworkId, changes }));
      return true;
    };
    const flushPendingChanges = () => {
      if (!pendingChanges.size || !send([...pendingChanges.values()])) return;
      pendingChanges.clear();
    };
    const connect = () => {
      const socket = new WebSocket(collaborationSocketUrl(artworkId));
      socketRef.current = socket;
      socket.onopen = () => { setConnected(true); setSaveState("实时同步中"); flushPendingChanges(); };
      socket.onclose = () => {
        setConnected(false); setUsers([]);
        if (!disposed) { setSaveState("连接中断，正在重试..."); retryTimer = window.setTimeout(connect, 2000); }
      };
      socket.onerror = () => setSaveState("实时连接失败，正在重试...");
      socket.onmessage = (message) => {
        let event: CollaborationEvent;
        try { event = JSON.parse(message.data) as CollaborationEvent; } catch { return; }
        if (event.type === "ROOM_STATE") setUsers(normalizeOnlineUsers(event.onlineUsers || []));
        if (event.type === "CANVAS_STATE") applyRemoteCanvasState(event);
        if (event.type === "PIXEL_UPDATE" || event.type === "PIXEL_BATCH") applyRemotePixelUpdates(event);
        const savedVersion = event.version;
        if (event.type === "VERSION_SAVED" && savedVersion) setVersions((current) => normalizeVersions([savedVersion, ...current]));
      };
    };
    connect();
    const sendChanges = (event: Event) => {
      const changes = (event as CustomEvent<PixelChange[]>).detail;
      if (!changes?.length) return;
      if (!send(changes)) setSaveState("连接恢复后将自动同步");
    };
    window.addEventListener(LOCAL_PIXEL_CHANGE_EVENT, sendChanges);
    return () => { disposed = true; if (retryTimer !== null) window.clearTimeout(retryTimer); window.removeEventListener(LOCAL_PIXEL_CHANGE_EVENT, sendChanges); socketRef.current?.close(); };
  }, [artworkId]);

  const saveVersion = useCallback(async (description = "协作更新") => {
    setSaveState("正在生成版本...");
    const state = usePixelEditorStore.getState();
    const snapshot = JSON.stringify({ pixelGrid: state.pixelGrid, pixelSoftness: state.pixelSoftness, pixelOverrides: state.pixelOverrides, palette: state.palette, selectedColor: state.selectedColor, edgeSoftness: state.edgeSoftness });
    try {
      const response = await request.post(`/api/collaboration/${artworkId}/versions`, { snapshot, description }) as unknown as { code: number; msg: string; data: VersionPayload };
      if (response.code !== 200) throw new Error(response.msg);
      setVersions((current) => normalizeVersions([response.data, ...current])); setSaveState(`版本 V${response.data.versionNumber} 已保存`);
    } catch (error) { setSaveState(error instanceof Error ? error.message : "版本保存失败"); }
  }, [artworkId]);

  const restore = useCallback(async (version: ArtworkVersion) => {
    try {
      const response = await request.post(`/api/collaboration/${artworkId}/versions/${version.versionNumber}/restore`) as unknown as { code: number; msg: string; data: VersionPayload & { snapshotUrl: string } };
      if (response.code !== 200) throw new Error(response.msg);
      const parsed = JSON.parse(response.data.snapshotUrl) as { pixelGrid: string[][]; pixelSoftness: number[][]; pixelOverrides: boolean[][] };
      const state = usePixelEditorStore.getState();
      state.commitPixelGrid(parsed.pixelGrid, parsed.pixelSoftness, parsed.pixelOverrides, { action: "pixel_change", description: `恢复 V${version.versionNumber}` });
      setSaveState(`已恢复 V${version.versionNumber}`);
    } catch (error) { setSaveState(error instanceof Error ? error.message : "恢复失败"); }
  }, [artworkId]);

  return <main className="min-h-screen bg-[#08090d] text-zinc-100"><header className="sticky top-0 z-20 flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-cyan-400/20 bg-[#101119]/95 px-4 py-2 backdrop-blur"><div><p className="text-sm font-semibold text-white">{title}</p><p className="text-xs text-zinc-500">原作者：{author}</p></div><OnlineUsers users={users} /><div className="flex items-center gap-3"><span className={`inline-flex items-center gap-1.5 text-xs ${connected ? "text-emerald-300" : "text-amber-300"}`}>{connected ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}{saveState}</span><button type="button" title="保存协作版本" onClick={() => saveVersion()} className="grid size-8 place-items-center border border-cyan-400/40 text-cyan-200 hover:bg-cyan-400/10"><Save className="size-4" /></button></div></header><div className="grid lg:grid-cols-[minmax(0,1fr)_260px]"><PixelEditor collaborationMode /><aside className="border-l border-white/[0.1] bg-[#101119] p-4"><VersionTimeline versions={versions} onRestore={restore} /></aside></div></main>;
}
