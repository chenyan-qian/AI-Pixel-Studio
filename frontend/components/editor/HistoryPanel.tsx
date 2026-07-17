"use client";

import { History, Redo2, Trash2, Undo2 } from "lucide-react";
import { useEffect } from "react";
import { usePixelEditorStore } from "@/lib/pixel-editor-store";

const actionLabels = { initial: "初始状态", pixel_change: "像素修改", fill: "区域填充", clear: "清空画布" };

export default function HistoryPanel() {
  const history = usePixelEditorStore((state) => state.history);
  const historyIndex = usePixelEditorStore((state) => state.historyIndex);
  const undo = usePixelEditorStore((state) => state.undo);
  const redo = usePixelEditorStore((state) => state.redo);
  const clear = usePixelEditorStore((state) => state.clear);
  const goToHistory = usePixelEditorStore((state) => state.goToHistory);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']") || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) redo(); else undo();
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [redo, undo]);

  return <section className="border-t border-white/[0.1] pt-4">
    <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 text-xs font-medium text-zinc-200"><History className="size-3.5 text-violet-300" />历史记录</h3><span className="text-[10px] text-zinc-600">{historyIndex + 1} / {history.length}</span></div>
    <div className="mb-3 grid grid-cols-3 gap-2">
      <button type="button" title="撤销 (Ctrl+Z)" aria-label="撤销" disabled={historyIndex <= 0} onClick={undo} className="grid h-8 place-items-center border border-white/[0.12] text-zinc-300 hover:border-violet-400 disabled:cursor-not-allowed disabled:opacity-35"><Undo2 className="size-4" /></button>
      <button type="button" title="恢复 (Ctrl+Shift+Z)" aria-label="恢复" disabled={historyIndex >= history.length - 1} onClick={redo} className="grid h-8 place-items-center border border-white/[0.12] text-zinc-300 hover:border-violet-400 disabled:cursor-not-allowed disabled:opacity-35"><Redo2 className="size-4" /></button>
      <button type="button" title="清空画布" aria-label="清空画布" onClick={clear} className="grid h-8 place-items-center border border-rose-400/30 text-rose-200 hover:bg-rose-400/10"><Trash2 className="size-4" /></button>
    </div>
    <div className="max-h-64 overflow-y-auto border-y border-white/[0.08] py-1" aria-label="历史操作时间线">
      {history.map((record, index) => {
        const isCurrent = index === historyIndex;
        return <button key={record.id} type="button" onClick={() => goToHistory(index)} aria-current={isCurrent ? "step" : undefined} className={`relative flex w-full items-start gap-2 border-l-2 px-2 py-2 text-left transition-colors ${isCurrent ? "border-violet-400 bg-violet-400/10" : "border-white/[0.12] hover:bg-white/[0.05]"}`}>
          <span className={`mt-1 size-1.5 shrink-0 ${isCurrent ? "bg-violet-300" : "bg-zinc-600"}`} />
          <span className="min-w-0 flex-1"><span className="block truncate text-[11px] text-zinc-200">{index === historyIndex ? "当前状态 - " : `步骤${record.id} - `}{record.description}</span><span className="mt-0.5 block text-[10px] text-zinc-500">{actionLabels[record.action]} · {record.timestamp}</span></span>
        </button>;
      }).reverse()}
    </div>
    <p className="mt-2 text-[10px] leading-4 text-zinc-600">最近 20 步保留完整快照，较早步骤使用压缩快照。</p>
  </section>;
}
