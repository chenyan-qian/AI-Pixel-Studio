"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PixelEditor from "@/components/editor/PixelEditor";
import { refreshSession } from "@/lib/auth";
import { normalizePalette, usePixelEditorStore } from "@/lib/pixel-editor-store";
import request from "@/lib/request";
import type { WorkRecord } from "@/lib/work";

/** 编辑器路由只接受已完成像素分析的矩阵状态。 */
export default function EditorPage() {
  const router = useRouter();
  const gridWidth = usePixelEditorStore((state) => state.gridWidth);
  const [ready, setReady] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<WorkRecord["reviewStatus"]>("DRAFT");

  useEffect(() => {
    let cancelled = false;
    refreshSession().then((user) => {
      if (!user) { router.replace("/login"); return; }
      const requestedWorkId = new URLSearchParams(window.location.search).get("workId");
      if (!requestedWorkId) {
        if (gridWidth === 0) router.replace("/workspace"); else setReady(true);
        return;
      }
      return request.get(`/api/work/${requestedWorkId}`);
    }).then((response) => {
      if (!response || cancelled) return;
      const result = response as unknown as { code: number; msg: string; data: WorkRecord };
      if (result.code !== 200 || !result.data) throw new Error(result.msg || "Unable to load work");
      const saved = JSON.parse(result.data.pixelData) as Record<string, unknown>;
      if (!Array.isArray(saved.pixelGrid) || !Array.isArray(saved.pixelSoftness) || !Array.isArray(saved.pixelOverrides)) throw new Error("Saved work is incomplete");
      const history = Array.isArray(saved.history) && saved.history.length > 0
        ? saved.history as ReturnType<typeof usePixelEditorStore.getState>["history"]
        : [{ id: 1, action: "initial" as const, description: "已保存的编辑状态", timestamp: "", pixelData: saved.pixelGrid as string[][], softnessData: saved.pixelSoftness as number[][], overrideData: saved.pixelOverrides as boolean[][] }];
      usePixelEditorStore.setState({
        gridWidth: result.data.gridWidth, gridHeight: result.data.gridHeight, pixelSize: result.data.pixelSize,
        canvasWidth: result.data.canvasWidth, canvasHeight: result.data.canvasHeight,
        pixelGrid: saved.pixelGrid as string[][], pixelSoftness: saved.pixelSoftness as number[][], pixelOverrides: saved.pixelOverrides as boolean[][],
        initialPixelGrid: (history[0]?.pixelData || saved.pixelGrid) as string[][],
        sourceImageUrl: result.data.sourceImageUrl, sourceWidth: result.data.imageWidth, sourceHeight: result.data.imageHeight,
        workId: result.data.id, workTitle: result.data.title, history, historyIndex: typeof saved.historyIndex === "number" ? saved.historyIndex : history.length - 1,
        palette: Array.isArray(saved.palette) ? normalizePalette(saved.palette as string[]) : usePixelEditorStore.getState().palette,
        selectedColor: typeof saved.selectedColor === "string" ? saved.selectedColor : "#FF5733",
        edgeSoftness: typeof saved.edgeSoftness === "number" ? saved.edgeSoftness : 0, hoveredPixel: null,
      });
      setReviewStatus(result.data.reviewStatus);
      setReady(true);
    }).catch(() => { if (!cancelled) router.replace("/works"); });
    return () => { cancelled = true; };
  }, [router, gridWidth]);

  return ready ? <PixelEditor initialReviewStatus={reviewStatus} /> : <main className="grid min-h-screen place-items-center bg-[#08090d] text-sm text-zinc-500">正在打开编辑器...</main>;
}
