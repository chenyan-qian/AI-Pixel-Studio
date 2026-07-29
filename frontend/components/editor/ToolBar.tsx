"use client";

import { Eraser, Pencil, Pipette } from "lucide-react";
import { type EditorTool, usePixelEditorStore } from "@/lib/pixel-editor-store";

const tools: Array<{ id: EditorTool; label: string; icon: typeof Pencil }> = [
  { id: "pencil", label: "画笔", icon: Pencil },
  { id: "eraser", label: "橡皮擦", icon: Eraser },
  { id: "eyedropper", label: "吸管", icon: Pipette },
];

/** 左侧绘制工具栏，只保存当前选中的工具类型。 */
export default function ToolBar() {
  const tool = usePixelEditorStore((state) => state.tool);
  const setTool = usePixelEditorStore((state) => state.setTool);

  return (
    <aside className="flex min-h-full flex-row gap-2 border-b border-white/[0.1] bg-[#101119] p-2 lg:flex-col lg:border-b-0 lg:border-r" aria-label="绘制工具">
      {tools.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" title={label} aria-label={label} onClick={() => setTool(id)} className={`grid size-10 place-items-center border transition ${tool === id ? "border-violet-400 bg-violet-500 text-white" : "border-white/[0.1] text-zinc-400 hover:border-zinc-500 hover:text-white"}`}>
          <Icon className="size-4" />
        </button>
      ))}
    </aside>
  );
}
