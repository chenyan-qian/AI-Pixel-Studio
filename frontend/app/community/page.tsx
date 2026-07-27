"use client";

import Link from "next/link";
import { ImageIcon, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import request from "@/lib/request";
import { absoluteImageUrl, type CommunityWork } from "@/lib/work";

interface ApiResponse<T> { code: number; msg: string; data: T; }

export default function CommunityPage() {
  const [works, setWorks] = useState<CommunityWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    request.get("/api/community/works")
      .then((response) => {
        const result = response as unknown as ApiResponse<CommunityWork[]>;
        if (result.code !== 200) throw new Error(result.msg || "加载社区作品失败");
        setWorks(result.data || []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "加载社区作品失败"))
      .finally(() => setLoading(false));
  }, []);

  return <main className="grid-background min-h-screen bg-[#08090d] px-5 pb-16 pt-28 text-zinc-100 sm:px-8">
    <Navbar />
    <section className="mx-auto max-w-6xl py-8 sm:py-12"><p className="text-sm font-semibold tracking-[0.18em] text-cyan-300">COMMUNITY</p><h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">社区作品</h1><p className="mt-3 text-sm text-zinc-400">这里展示通过管理员审核的 PixelVerse 创作。</p>
      {error && <p className="mt-7 border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {loading ? <p className="mt-10 text-sm text-zinc-500">正在加载社区作品...</p> : works.length === 0 ? <div className="mt-10 grid min-h-64 place-items-center border border-dashed border-white/[0.14] text-center"><div><ImageIcon className="mx-auto size-8 text-zinc-600" /><p className="mt-3 text-sm text-zinc-400">还没有已发布的作品</p><Link href="/workspace" className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-300"><Sparkles className="size-4" />开始创作</Link></div></div> : <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{works.map((work) => <article key={work.id} className="overflow-hidden border border-white/[0.12] bg-[#10111a]/90 shadow-xl shadow-black/10"><div className="aspect-[4/3] bg-[#161827]">{absoluteImageUrl(work.pixelImageUrl || work.sourceImageUrl) && <img src={absoluteImageUrl(work.pixelImageUrl || work.sourceImageUrl)!} alt={work.title} className="size-full object-cover [image-rendering:pixelated]" />}</div><div className="p-4"><h2 className="truncate text-base font-semibold text-white">{work.title}</h2><p className="mt-2 text-xs text-zinc-500">{work.imageWidth} x {work.imageHeight} · {work.pixelSize}px</p><p className="mt-1 text-xs text-zinc-600">发布于 {work.publishedTime ? new Date(work.publishedTime).toLocaleDateString("zh-CN") : "-"}</p></div></article>)}</div>}
    </section>
  </main>;
}
