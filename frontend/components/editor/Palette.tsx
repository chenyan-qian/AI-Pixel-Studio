"use client";

import { Plus } from "lucide-react";
import { useMemo } from "react";
import { normalizePalette, usePixelEditorStore } from "@/lib/pixel-editor-store";

/** 常用颜色面板，点击色块会直接成为当前绘制颜色。 */
export default function Palette() {
  const palette = usePixelEditorStore((state) => state.palette);
  const selectedColor = usePixelEditorStore((state) => state.selectedColor);
  const setSelectedColor = usePixelEditorStore((state) => state.setSelectedColor);
  const addPaletteColor = usePixelEditorStore((state) => state.addPaletteColor);
  const uniquePalette = useMemo(() => normalizePalette(palette), [palette]);

  return (
    <section className="border-t border-white/[0.1] pt-4">
      <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-medium text-zinc-300">调色板</h3><button type="button" title="保存当前颜色" aria-label="保存当前颜色" onClick={() => addPaletteColor()} className="grid size-7 place-items-center border border-white/[0.12] text-zinc-300 hover:border-violet-400 hover:text-white"><Plus className="size-3.5" /></button></div>
      <div className="grid grid-cols-6 gap-2">
        {uniquePalette.map((color) => <button key={`color-${color}`} type="button" title={color} aria-label={`选择 ${color}`} onClick={() => setSelectedColor(color)} className={`size-7 border ${selectedColor === color ? "border-white ring-1 ring-violet-400" : "border-white/[0.15]"}`} style={{ backgroundColor: color }} />)}
      </div>
    </section>
  );
}
