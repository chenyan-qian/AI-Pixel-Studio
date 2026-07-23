"use client";

import Link from "next/link";
import { Download, ImageDown, Save } from "lucide-react";
import { useState } from "react";
import CanvasBoard from "@/components/editor/CanvasBoard";
import ColorPicker from "@/components/editor/ColorPicker";
import HistoryPanel from "@/components/editor/HistoryPanel";
import Palette from "@/components/editor/Palette";
import ToolBar from "@/components/editor/ToolBar";
import { downloadImage, exportPixelImage } from "@/lib/pixel-export";
import { TRANSPARENT, usePixelEditorStore } from "@/lib/pixel-editor-store";
import request from "@/lib/request";

interface SaveWorkResponse { code: number; msg: string; data: { id: number }; }

function toRgbText(color: string) {
  if (color === TRANSPARENT) return "透明";
  const value = color.slice(1);
  return `${parseInt(value.slice(0, 2), 16)}, ${parseInt(value.slice(2, 4), 16)}, ${parseInt(value.slice(4, 6), 16)}`;
}

/** 参考 Piskel 布局的像素编辑工作台。 */
export default function PixelEditor() {
  const pixelGrid = usePixelEditorStore((state) => state.pixelGrid);
  const pixelOverrides = usePixelEditorStore((state) => state.pixelOverrides);
  const pixelSoftness = usePixelEditorStore((state) => state.pixelSoftness);
  const gridWidth = usePixelEditorStore((state) => state.gridWidth);
  const gridHeight = usePixelEditorStore((state) => state.gridHeight);
  const pixelSize = usePixelEditorStore((state) => state.pixelSize);
  const canvasWidth = usePixelEditorStore((state) => state.canvasWidth);
  const canvasHeight = usePixelEditorStore((state) => state.canvasHeight);
  const sourceImageUrl = usePixelEditorStore((state) => state.sourceImageUrl);
  const sourceWidth = usePixelEditorStore((state) => state.sourceWidth);
  const sourceHeight = usePixelEditorStore((state) => state.sourceHeight);
  const hoveredPixel = usePixelEditorStore((state) => state.hoveredPixel);
  const history = usePixelEditorStore((state) => state.history);
  const workId = usePixelEditorStore((state) => state.workId);
  const setWorkId = usePixelEditorStore((state) => state.setWorkId);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  async function exportImage(format: "png" | "jpg") {
    if (exporting) return;
    setExporting(true);
    setSaveMessage("");
    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    try {
      const dataUrl = await exportPixelImage({ pixelGrid, pixelOverrides, pixelSoftness, gridWidth, gridHeight, canvasWidth, canvasHeight, sourceImageUrl, sourceWidth, sourceHeight, mimeType });
      downloadImage(dataUrl, format);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "导出失败，请稍后重试。");
    } finally {
      setExporting(false);
    }
  }

  async function saveWork() {
    setSaving(true);
    setSaveMessage("");
    // 保存当前画布以及当前可见的历史分支，已压缩的历史节点继续沿用压缩数据。
    const payload = { sourceImageUrl, title: "未命名像素作品", size: pixelSize, gridWidth, gridHeight, canvasWidth, canvasHeight, pixelData: { pixelGrid, pixelOverrides }, history: history.map((record) => ({ id: record.id, operationType: record.action, operationDesc: record.description, operationTime: record.timestamp, pixelData: record.pixelData, softnessData: record.softnessData, overrideData: record.overrideData, compressedSnapshot: record.compressedSnapshot })) };
    try {
      // 第一次保存会创建作品，之后继续保存会更新同一条作品记录。
      const response = workId
        ? await request.put<typeof payload, SaveWorkResponse>(`/api/works/${workId}`, payload)
        : await request.post<typeof payload, SaveWorkResponse>("/api/works", payload);
      if (response.code !== 200 || !response.data) throw new Error(response.msg || "保存失败");
      setWorkId(response.data.id);
      setSaveMessage("已保存");
    } catch (error) {
      const message = (error as { response?: { data?: { msg?: string } } })?.response?.data?.msg;
      setSaveMessage(message || (error instanceof Error ? error.message : "保存失败"));
    } finally { setSaving(false); }
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#08090d] text-zinc-100">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.1] bg-[#101119] px-4">
        <div className="flex items-center gap-4"><Link href="/workspace" className="text-sm font-semibold text-white">PixelVerse</Link><span className="border-l border-white/[0.12] pl-4 text-xs text-zinc-500">{gridWidth} × {gridHeight} 格 · {pixelSize}px 像素编辑器</span></div>
        <div className="flex items-center gap-2"><button type="button" onClick={saveWork} disabled={saving} className="inline-flex h-8 items-center gap-1.5 border border-violet-400/50 bg-violet-400/10 px-2.5 text-xs text-violet-100 hover:bg-violet-400/20 disabled:opacity-50"><Save className="size-3.5" />{saving ? "保存中" : "保存"}</button><button type="button" onClick={() => exportImage("png")} disabled={exporting} className="inline-flex h-8 items-center gap-1.5 border border-white/[0.14] px-2.5 text-xs text-zinc-200 hover:border-violet-400 disabled:opacity-50"><Download className="size-3.5" />{exporting ? "导出中" : "PNG"}</button><button type="button" onClick={() => exportImage("jpg")} disabled={exporting} className="inline-flex h-8 items-center gap-1.5 border border-white/[0.14] px-2.5 text-xs text-zinc-200 hover:border-violet-400 disabled:opacity-50"><ImageDown className="size-3.5" />JPG</button></div>
      </header>
      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] lg:grid-cols-[58px_minmax(0,1fr)_280px] lg:grid-rows-1">
        <ToolBar />
        <CanvasBoard />
        <aside className="border-t border-white/[0.1] bg-[#101119] p-4 lg:overflow-y-auto lg:border-l lg:border-t-0">
          <ColorPicker />
          <Palette />
          <HistoryPanel />
          {saveMessage && <p className={`mt-3 text-[11px] ${saveMessage === "已保存" ? "text-emerald-300" : "text-rose-300"}`} role="status">{saveMessage}</p>}<section className="border-t border-white/[0.1] pt-4"><h3 className="text-xs font-medium text-zinc-300">当前像素</h3>{hoveredPixel ? <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs"><dt className="text-zinc-500">坐标</dt><dd className="font-mono text-zinc-200">{hoveredPixel.x}, {hoveredPixel.y}</dd><dt className="text-zinc-500">RGB</dt><dd className="font-mono text-zinc-200">{toRgbText(hoveredPixel.color)}</dd><dt className="text-zinc-500">HEX</dt><dd className="font-mono text-zinc-200">{hoveredPixel.color === TRANSPARENT ? "透明" : hoveredPixel.color}</dd></dl> : <p className="mt-3 text-xs text-zinc-600">移动到画布查看像素信息</p>}</section>
        </aside>
      </div>
    </main>
  );
}
