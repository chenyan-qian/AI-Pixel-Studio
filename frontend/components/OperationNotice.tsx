"use client";

import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { useEffect } from "react";

export type NoticeTone = "success" | "error" | "info";
export interface OperationNoticeState { id: number; message: string; tone: NoticeTone; }

export default function OperationNotice({ notice, onClose }: { notice: OperationNoticeState | null; onClose: () => void }) {
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timer);
  }, [notice, onClose]);

  if (!notice) return null;
  const styles = notice.tone === "success"
    ? "border-emerald-400/45 bg-emerald-950/95 text-emerald-50 shadow-emerald-950/50"
    : notice.tone === "error"
      ? "border-rose-400/45 bg-rose-950/95 text-rose-50 shadow-rose-950/50"
      : "border-cyan-400/45 bg-[#102735]/95 text-cyan-50 shadow-cyan-950/50";
  const Icon = notice.tone === "success" ? CheckCircle2 : notice.tone === "error" ? CircleAlert : Info;

  return <div className="pointer-events-none fixed inset-x-0 top-5 z-[100] flex justify-center px-4" aria-live="polite">
    <div role="alert" className={`pointer-events-auto flex w-full max-w-md items-center gap-3 border px-4 py-3 shadow-2xl backdrop-blur ${styles}`}>
      <Icon className="size-5 shrink-0" />
      <p className="flex-1 text-sm font-medium">{notice.message}</p>
      <button type="button" onClick={onClose} aria-label="关闭提示" className="grid size-7 shrink-0 place-items-center hover:bg-white/10"><X className="size-4" /></button>
    </div>
  </div>;
}
