"use client";

import Link from "next/link";
import { AlertTriangle, FolderOpen, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { clearSession, getToken, getUser } from "@/lib/auth";
import request from "@/lib/request";
import { absoluteImageUrl, type WorkRecord } from "@/lib/work";

interface ApiResponse<T> { code: number; msg: string; data: T; }

export default function WorksPage() {
  const router = useRouter();
  const [works, setWorks] = useState<WorkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WorkRecord | null>(null);

  useEffect(() => {
    if (!getToken() || !getUser()) { clearSession(); router.replace("/login"); return; }
    request.get("/api/work/my")
      .then((response) => {
        const result = response as unknown as ApiResponse<WorkRecord[]>;
        if (result.code !== 200) throw new Error(result.msg || "Unable to load works");
        setWorks(result.data || []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load works"))
      .finally(() => setLoading(false));
  }, [router]);

  async function removeWork() {
    if (!pendingDelete) return;
    setRemoving(pendingDelete.id);
    try {
      const response = await request.delete(`/api/work/${pendingDelete.id}`) as unknown as ApiResponse<null>;
      if (response.code !== 200) throw new Error(response.msg || "Unable to delete work");
      setWorks((current) => current.filter((work) => work.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete work");
    } finally { setRemoving(null); }
  }

  return (
    <main className="grid-background min-h-screen bg-[#08090d] px-5 pb-16 pt-28 text-zinc-100 sm:px-8">
      <Navbar />
      <section className="mx-auto max-w-6xl py-8 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-semibold tracking-[0.18em] text-cyan-300">MY WORKS</p><h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">我的作品</h1><p className="mt-3 text-sm text-zinc-400">已保存的作品可随时继续编辑。</p></div>
          <Link href="/workspace" className="glow-button inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium text-white"><Plus className="size-4" />新建作品</Link>
        </div>
        {error && <p className="mt-7 border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
        {loading ? <div className="mt-10 text-sm text-zinc-500">正在加载作品...</div> : works.length === 0 ? <div className="mt-10 grid min-h-60 place-items-center border border-dashed border-white/[0.14] bg-white/[0.02] text-center"><div><FolderOpen className="mx-auto size-8 text-zinc-600" /><p className="mt-3 text-sm text-zinc-400">还没有作品</p><Link href="/workspace" className="mt-4 inline-block text-sm text-cyan-300 hover:text-cyan-100">开始创作</Link></div></div> : <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((work) => <article key={work.id} className="group overflow-hidden border border-white/[0.12] bg-[#10111a]/90 shadow-xl shadow-black/10">
            <Link href={`/editor?workId=${work.id}`} className="block">
              <div className="aspect-[4/3] bg-[#161827]">{absoluteImageUrl(work.pixelImageUrl || work.sourceImageUrl) ? <img src={absoluteImageUrl(work.pixelImageUrl || work.sourceImageUrl)!} alt="" className="size-full object-cover [image-rendering:pixelated]" /> : null}</div>
              <div className="p-4"><h2 className="truncate text-base font-semibold text-white">{work.title}</h2><p className="mt-2 text-xs text-zinc-500">{work.imageWidth} x {work.imageHeight} · {work.pixelSize}px</p><p className="mt-1 text-xs text-zinc-600">更新于 {new Date(work.updateTime).toLocaleString("zh-CN")}</p></div>
            </Link>
            <div className="flex justify-end border-t border-white/[0.08] px-3 py-2"><button type="button" title="删除作品" aria-label="删除作品" onClick={() => setPendingDelete(work)} disabled={removing === work.id} className="grid size-8 place-items-center text-zinc-500 hover:bg-rose-400/10 hover:text-rose-200 disabled:opacity-50"><Trash2 className="size-4" /></button></div>
          </article>)}
        </div>}
      </section>
      {pendingDelete && <div className="fixed inset-0 z-[70] grid place-items-center p-5" style={{ backgroundColor: "var(--modal-backdrop)" }} role="dialog" aria-modal="true" aria-labelledby="delete-work-title" onMouseDown={() => !removing && setPendingDelete(null)}>
        <section className="w-full max-w-md border border-rose-300/25 bg-[#131427] p-6 shadow-2xl shadow-black/50" onMouseDown={(event) => event.stopPropagation()}>
          <div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center border border-rose-300/25 bg-rose-400/10 text-rose-200"><AlertTriangle className="size-5" /></span><div><h2 id="delete-work-title" className="text-lg font-semibold text-white">删除作品？</h2><p className="mt-1 text-sm leading-6 text-zinc-400">将永久删除“{pendingDelete.title}”及其编辑历史，此操作无法撤销。</p></div></div>
          <div className="mt-7 flex justify-end gap-3"><button type="button" onClick={() => setPendingDelete(null)} disabled={Boolean(removing)} className="h-9 border border-white/[0.14] px-4 text-sm text-zinc-200 hover:bg-white/[0.06] disabled:opacity-50">取消</button><button type="button" onClick={removeWork} disabled={Boolean(removing)} className="inline-flex h-9 items-center gap-2 bg-rose-500 px-4 text-sm font-medium text-white hover:bg-rose-400 disabled:opacity-50"><Trash2 className="size-4" />{removing ? "正在删除..." : "删除作品"}</button></div>
        </section>
      </div>}
    </main>
  );
}
