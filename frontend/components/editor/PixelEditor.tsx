"use client";

import Link from "next/link";
import { Download, ImageDown } from "lucide-react";
import CanvasBoard from "@/components/editor/CanvasBoard";
import ColorPicker from "@/components/editor/ColorPicker";
import HistoryPanel from "@/components/editor/HistoryPanel";
import Palette from "@/components/editor/Palette";
import ToolBar from "@/components/editor/ToolBar";
import { downloadImage, exportPixelMatrix } from "@/lib/pixel-export";
import { TRANSPARENT, usePixelEditorStore } from "@/lib/pixel-editor-store";

function toRgbText(color: string) {
  if (color === TRANSPARENT) return "透明";
  const value = color.slice(1);
  return `${parseInt(value.slice(0, 2), 16)}, ${parseInt(value.slice(2, 4), 16)}, ${parseInt(value.slice(4, 6), 16)}`;
}

/** 参考 Piskel 布局的像素编辑工作台。 */
export default function PixelEditor() {
  const pixels = usePixelEditorStore((state) => state.pixels);
  const size = usePixelEditorStore((state) => state.size);
  const hoveredPixel = usePixelEditorStore((state) => state.hoveredPixel);

  function exportImage(format: "png" | "jpg") {
    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    downloadImage(exportPixelMatrix(pixels, size, mimeType), format);
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#08090d] text-zinc-100">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.1] bg-[#101119] px-4">
        <div className="flex items-center gap-4"><Link href="/workspace" className="text-sm font-semibold text-white">AI Pixel Studio</Link><span className="border-l border-white/[0.12] pl-4 text-xs text-zinc-500">{size} × {size} 像素编辑器</span></div>
        <div className="flex items-center gap-2"><button type="button" onClick={() => exportImage("png")} className="inline-flex h-8 items-center gap-1.5 border border-white/[0.14] px-2.5 text-xs text-zinc-200 hover:border-violet-400"><Download className="size-3.5" />PNG</button><button type="button" onClick={() => exportImage("jpg")} className="inline-flex h-8 items-center gap-1.5 border border-white/[0.14] px-2.5 text-xs text-zinc-200 hover:border-violet-400"><ImageDown className="size-3.5" />JPG</button></div>
      </header>
      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] lg:grid-cols-[58px_minmax(0,1fr)_280px] lg:grid-rows-1">
        <ToolBar />
        <CanvasBoard />
        <aside className="border-t border-white/[0.1] bg-[#101119] p-4 lg:overflow-y-auto lg:border-l lg:border-t-0">
          <ColorPicker />
          <Palette />
          <HistoryPanel />
          <section className="border-t border-white/[0.1] pt-4"><h3 className="text-xs font-medium text-zinc-300">当前像素</h3>{hoveredPixel ? <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs"><dt className="text-zinc-500">坐标</dt><dd className="font-mono text-zinc-200">{hoveredPixel.x}, {hoveredPixel.y}</dd><dt className="text-zinc-500">RGB</dt><dd className="font-mono text-zinc-200">{toRgbText(hoveredPixel.color)}</dd><dt className="text-zinc-500">HEX</dt><dd className="font-mono text-zinc-200">{hoveredPixel.color === TRANSPARENT ? "透明" : hoveredPixel.color}</dd></dl> : <p className="mt-3 text-xs text-zinc-600">移动到画布查看像素信息</p>}</section>
        </aside>
      </div>
    </main>
  );
}
