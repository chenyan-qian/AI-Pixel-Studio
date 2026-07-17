"use client";

import { Redo2, Trash2, Undo2 } from "lucide-react";
import { usePixelEditorStore } from "@/lib/pixel-editor-store";

/** 管理矩阵快照历史，撤销和恢复均以一次完整操作为单位。 */
export default function HistoryPanel() {
  const historyIndex = usePixelEditorStore((state) => state.historyIndex);
  const historyLength = usePixelEditorStore((state) => state.history.length);
  const undo = usePixelEditorStore((state) => state.undo);
  const redo = usePixelEditorStore((state) => state.redo);
  const clear = usePixelEditorStore((state) => state.clear);

  return <section className="border-t border-white/[0.1] pt-4"><h3 className="mb-3 text-xs font-medium text-zinc-300">历史记录</h3><div className="grid grid-cols-3 gap-2"><button type="button" title="撤销" aria-label="撤销" disabled={historyIndex <= 0} onClick={undo} className="grid h-9 place-items-center border border-white/[0.12] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-35 hover:border-violet-400"><Undo2 className="size-4" /></button><button type="button" title="恢复" aria-label="恢复" disabled={historyIndex >= historyLength - 1} onClick={redo} className="grid h-9 place-items-center border border-white/[0.12] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-35 hover:border-violet-400"><Redo2 className="size-4" /></button><button type="button" title="清空画布" aria-label="清空画布" onClick={clear} className="grid h-9 place-items-center border border-rose-400/30 text-rose-200 hover:bg-rose-400/10"><Trash2 className="size-4" /></button></div><p className="mt-2 text-[11px] text-zinc-600">{historyIndex + 1} / {historyLength}</p></section>;
}
