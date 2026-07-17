"use client";

import { useMemo } from "react";
import { usePixelEditorStore } from "@/lib/pixel-editor-store";

interface Rgb { r: number; g: number; b: number; }
interface Hsv { h: number; s: number; v: number; }

function clamp(value: number, maximum: number) { return Math.max(0, Math.min(maximum, value)); }

function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((item) => item + item).join("") : normalized;
  return { r: parseInt(value.slice(0, 2), 16) || 0, g: parseInt(value.slice(2, 4), 16) || 0, b: parseInt(value.slice(4, 6), 16) || 0 };
}

function rgbToHex({ r, g, b }: Rgb) {
  return `#${[r, g, b].map((value) => Math.round(clamp(value, 255)).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const red = r / 255; const green = g / 255; const blue = b / 255;
  const maximum = Math.max(red, green, blue); const minimum = Math.min(red, green, blue); const difference = maximum - minimum;
  let hue = 0;
  if (difference !== 0) hue = maximum === red ? 60 * (((green - blue) / difference) % 6) : maximum === green ? 60 * ((blue - red) / difference + 2) : 60 * ((red - green) / difference + 4);
  return { h: Math.round((hue + 360) % 360), s: Math.round(maximum === 0 ? 0 : difference / maximum * 100), v: Math.round(maximum * 100) };
}

function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const chroma = (v / 100) * (s / 100); const section = h / 60; const match = chroma * (1 - Math.abs(section % 2 - 1)); const offset = v / 100 - chroma;
  const [red, green, blue] = section < 1 ? [chroma, match, 0] : section < 2 ? [match, chroma, 0] : section < 3 ? [0, chroma, match] : section < 4 ? [0, match, chroma] : section < 5 ? [match, 0, chroma] : [chroma, 0, match];
  return { r: Math.round((red + offset) * 255), g: Math.round((green + offset) * 255), b: Math.round((blue + offset) * 255) };
}

/** 当前颜色面板，同时提供 HEX、RGB、HSV 三种编辑方式。 */
export default function ColorPicker() {
  const selectedColor = usePixelEditorStore((state) => state.selectedColor);
  const setSelectedColor = usePixelEditorStore((state) => state.setSelectedColor);
  const edgeSoftness = usePixelEditorStore((state) => state.edgeSoftness);
  const setEdgeSoftness = usePixelEditorStore((state) => state.setEdgeSoftness);
  const rgb = useMemo(() => hexToRgb(selectedColor), [selectedColor]);
  const hsv = useMemo(() => rgbToHsv(rgb), [rgb]);

  function updateRgb(key: keyof Rgb, value: string) {
    const next = { ...rgb, [key]: clamp(Number(value) || 0, 255) };
    setSelectedColor(rgbToHex(next));
  }

  function updateHsv(key: keyof Hsv, value: string) {
    const maximum = key === "h" ? 359 : 100;
    setSelectedColor(rgbToHex(hsvToRgb({ ...hsv, [key]: clamp(Number(value) || 0, maximum) })));
  }

  return (
    <section>
      <h3 className="text-xs font-medium text-zinc-300">当前颜色</h3>
      <div className="mt-3 flex gap-3"><input type="color" value={selectedColor} onChange={(event) => setSelectedColor(event.target.value)} aria-label="选择当前颜色" className="size-12 shrink-0 cursor-pointer border border-white/[0.14] bg-transparent p-1" /><div className="min-w-0 flex-1"><input value={selectedColor} onChange={(event) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(event.target.value) && setSelectedColor(event.target.value)} className="h-9 w-full border border-white/[0.12] bg-[#08090d] px-2 font-mono text-xs uppercase text-zinc-100 outline-none focus:border-violet-400" aria-label="HEX 颜色" /><p className="mt-1 text-[11px] text-zinc-500">HEX</p></div></div>
      <ColorRow label="RGB" values={[rgb.r, rgb.g, rgb.b]} names={["R", "G", "B"]} maximum={255} onChange={(index, value) => updateRgb((["r", "g", "b"] as Array<keyof Rgb>)[index], value)} />
      <ColorRow label="HSV" values={[hsv.h, hsv.s, hsv.v]} names={["H", "S", "V"]} maximum={100} onChange={(index, value) => updateHsv((["h", "s", "v"] as Array<keyof Hsv>)[index], value)} />
      <div className="mt-5 border-t border-white/[0.1] pt-4"><div className="flex items-center justify-between"><label htmlFor="edge-softness" className="text-xs font-medium text-zinc-300">边缘柔化</label><span className="text-xs tabular-nums text-zinc-500">{edgeSoftness}%</span></div><input id="edge-softness" type="range" min="0" max="100" value={edgeSoftness} onChange={(event) => setEdgeSoftness(Number(event.target.value))} className="mt-3 w-full accent-violet-500" /><p className="mt-1 text-[11px] leading-4 text-zinc-600">仅柔化修改区域与原图之间的边缘。</p></div>
    </section>
  );
}

function ColorRow({ label, values, names, maximum, onChange }: { label: string; values: number[]; names: string[]; maximum: number; onChange: (index: number, value: string) => void }) {
  return <div className="mt-4"><p className="mb-2 text-[11px] text-zinc-500">{label}</p><div className="grid grid-cols-3 gap-2">{values.map((value, index) => <label key={names[index]} className="min-w-0"><span className="mb-1 block text-[10px] text-zinc-500">{names[index]}</span><input type="number" min={0} max={names[index] === "H" ? 359 : maximum} value={value} onChange={(event) => onChange(index, event.target.value)} className="h-8 w-full border border-white/[0.12] bg-[#08090d] px-1.5 text-xs text-zinc-200 outline-none focus:border-violet-400" /></label>)}</div></div>;
}
