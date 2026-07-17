"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PixelEditor from "@/components/editor/PixelEditor";
import { clearSession, getToken, getUser } from "@/lib/auth";
import { usePixelEditorStore } from "@/lib/pixel-editor-store";

/** 编辑器路由只接受已完成像素分析的矩阵状态。 */
export default function EditorPage() {
  const router = useRouter();
  const size = usePixelEditorStore((state) => state.size);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken() || !getUser()) { clearSession(); router.replace("/login"); return; }
    if (size === 0) { router.replace("/workspace"); return; }
    setReady(true);
  }, [router, size]);

  return ready ? <PixelEditor /> : <main className="grid min-h-screen place-items-center bg-[#08090d] text-sm text-zinc-500">正在打开编辑器...</main>;
}
