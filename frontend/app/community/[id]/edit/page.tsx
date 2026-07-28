"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CollaborationEditor from "@/components/collaboration/CollaborationEditor";
import { getToken, getUser } from "@/lib/auth";
import request from "@/lib/request";
import { normalizePalette, usePixelEditorStore } from "@/lib/pixel-editor-store";
import type { WorkRecord } from "@/lib/work";

interface DetailResponse { code: number; msg: string; data: { artwork: WorkRecord; username: string; permission: { visibility: string; allowEdit: boolean }; versions: Array<{ id: number; versionNumber: number; description: string; creatorId: number; createTime: string }> }; }
export default function CommunityCollaborationPage() {
  const params = useParams<{ id: string }>(); const router = useRouter(); const [detail, setDetail] = useState<DetailResponse["data"] | null>(null); const [error, setError] = useState("");
  useEffect(() => {
    if (!getToken() || !getUser()) { router.replace("/login"); return; }
    request.get(`/api/community/artworks/${params.id}`).then((response) => {
      const result = response as unknown as DetailResponse; if (result.code !== 200 || !result.data.permission.allowEdit || result.data.permission.visibility !== "PUBLIC_COLLAB") throw new Error("该作品当前仅展示，不能参与编辑");
      const artwork = result.data.artwork; const saved = JSON.parse(artwork.pixelData) as { pixelGrid: string[][]; pixelSoftness: number[][]; pixelOverrides: boolean[][]; palette?: string[]; selectedColor?: string; edgeSoftness?: number };
      if (!Array.isArray(saved.pixelGrid) || !Array.isArray(saved.pixelSoftness) || !Array.isArray(saved.pixelOverrides)) throw new Error("作品数据不完整");
      usePixelEditorStore.setState({ gridWidth: artwork.gridWidth, gridHeight: artwork.gridHeight, pixelSize: artwork.pixelSize, canvasWidth: artwork.canvasWidth, canvasHeight: artwork.canvasHeight, pixelGrid: saved.pixelGrid, initialPixelGrid: saved.pixelGrid.map((row) => [...row]), pixelSoftness: saved.pixelSoftness, pixelOverrides: saved.pixelOverrides, sourceImageUrl: artwork.sourceImageUrl, sourceWidth: artwork.imageWidth, sourceHeight: artwork.imageHeight, workId: artwork.id, workTitle: artwork.title, palette: saved.palette ? normalizePalette(saved.palette) : usePixelEditorStore.getState().palette, selectedColor: saved.selectedColor || "#FF5733", edgeSoftness: saved.edgeSoftness || 0, history: [{ id: 1, action: "initial", description: "协作画布", timestamp: "", pixelData: saved.pixelGrid, softnessData: saved.pixelSoftness, overrideData: saved.pixelOverrides }], historyIndex: 0, hoveredPixel: null });
      setDetail(result.data);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "协作画布加载失败"));
  }, [params.id, router]);
  if (error) return <main className="grid min-h-screen place-items-center bg-[#08090d] px-4 text-sm text-rose-300">{error}</main>;
  return detail ? <CollaborationEditor artworkId={detail.artwork.id} title={detail.artwork.title} author={detail.username} initialVersions={detail.versions} /> : <main className="grid min-h-screen place-items-center bg-[#08090d] text-sm text-zinc-500">正在加入创作房间...</main>;
}
