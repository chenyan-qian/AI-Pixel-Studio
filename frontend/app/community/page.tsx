"use client";

import Link from "next/link";
import { Clock3, Heart, ImageIcon, MessageCircle, Sparkles, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import request from "@/lib/request";
import { absoluteImageUrl, type CommunityWork } from "@/lib/work";

interface ApiResponse<T> { code: number; msg: string; data: T; }

type CommunityTab = "latest" | "popular" | "featured";

const tabs: Array<{ id: CommunityTab; label: string; icon: typeof Clock3 }> = [
  { id: "latest", label: "最新作品", icon: Clock3 },
  { id: "popular", label: "热门作品", icon: Heart },
  { id: "featured", label: "精选作品", icon: Trophy },
];

function formatDate(value: string | null) {
  if (!value) return "刚刚发布";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚发布";
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function engagement(work: CommunityWork) {
  return work.likeCount + work.commentCount;
}

export default function CommunityPage() {
  const [works, setWorks] = useState<CommunityWork[]>([]);
  const [activeTab, setActiveTab] = useState<CommunityTab>("latest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    request.get("/api/community/artworks")
      .then((response) => {
        const result = response as unknown as ApiResponse<CommunityWork[]>;
        if (result.code !== 200) throw new Error(result.msg || "加载社区作品失败");
        setWorks(result.data || []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "加载社区作品失败"))
      .finally(() => setLoading(false));
  }, []);

  const displayedWorks = useMemo(() => [...works].sort((left, right) => {
    if (activeTab === "latest") return new Date(right.createTime || 0).getTime() - new Date(left.createTime || 0).getTime();
    return engagement(right) - engagement(left);
  }), [activeTab, works]);

  return (
    <main className="theme-page grid-background min-h-screen px-4 pb-16 pt-28 sm:px-8">
      <Navbar />
      <section className="mx-auto max-w-7xl py-8 sm:py-12">
        <div className="theme-panel relative overflow-hidden border px-5 py-7 shadow-2xl sm:px-8 sm:py-9">
          <div className="theme-decoration-border absolute -right-10 -top-10 size-36 border" />
          <div className="theme-decoration-accent absolute bottom-0 right-14 h-16 w-px" />
          <p className="theme-accent relative text-xs font-semibold tracking-[0.2em]">PIXELVERSE COMMUNITY</p>
          <div className="relative mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="theme-text-primary text-3xl font-bold sm:text-4xl">社区画廊</h1>
              <p className="theme-text-secondary mt-3 max-w-2xl text-sm leading-6">发现经过审核的像素创作，欣赏创作者构建的每一个数字世界。</p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="作品分类">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => setActiveTab(id)} aria-pressed={activeTab === id}
                  className={`theme-filter inline-flex h-10 items-center gap-2 rounded-md border px-3.5 text-sm transition sm:px-4 ${activeTab === id ? "theme-filter-active shadow-lg" : ""}`}>
                  <Icon className="size-4" />{label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="theme-error mt-7 rounded-md border px-4 py-3 text-sm">{error}</p>}

        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="正在加载作品">
            {Array.from({ length: 8 }, (_, index) => <div className="theme-skeleton h-[350px] animate-pulse rounded-lg border" key={index} />)}
          </div>
        ) : displayedWorks.length === 0 ? (
          <div className="theme-card mt-8 grid min-h-72 place-items-center rounded-lg border border-dashed px-6 text-center">
            <div><ImageIcon className="theme-accent mx-auto size-9" /><p className="theme-text-secondary mt-4 text-sm">还没有已发布的作品</p><Link href="/workspace" className="theme-accent mt-4 inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-80"><Sparkles className="size-4" />开始创作</Link></div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedWorks.map((work) => {
              const imageUrl = absoluteImageUrl(work.imageUrl);
              const initial = work.username.trim().charAt(0).toUpperCase() || "P";
              return <article key={work.id} className="theme-artwork-card group overflow-hidden rounded-lg border shadow-xl transition duration-300 hover:-translate-y-1 hover:scale-[1.015]">
                <div className="theme-artwork-image relative aspect-[4/3] overflow-hidden shadow-[inset_0_-28px_32px_var(--overlay-color)]">
                  {imageUrl ? <img src={imageUrl} alt={work.title} className="size-full object-cover shadow-2xl transition duration-500 group-hover:scale-105 [image-rendering:pixelated]" /> : <div className="grid size-full place-items-center"><ImageIcon className="theme-text-tertiary size-9" /></div>}
                  <span className="theme-image-meta absolute left-3 top-3 rounded-md border px-2 py-1 text-[11px] font-medium backdrop-blur-sm">{work.width} x {work.height}</span>
                </div>
                <div className="p-4">
                  <h2 className="theme-text-primary truncate text-base font-semibold" title={work.title}>{work.title}</h2>
                  <div className="mt-4 flex items-center gap-2.5">
                    {work.avatar ? <img src={absoluteImageUrl(work.avatar) || undefined} alt={`${work.username} 的头像`} className="theme-decoration-border size-8 rounded-full border object-cover" /> : <span className="theme-avatar grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold">{initial}</span>}
                    <div className="min-w-0 flex-1"><p className="theme-text-primary truncate text-sm font-medium">{work.username}</p><p className="theme-text-tertiary mt-0.5 text-[11px]">{formatDate(work.createTime)}</p></div>
                    <span className="theme-size-tag rounded border px-1.5 py-1 text-[10px]">{work.pixelSize}px</span>
                  </div>
                  <div className="theme-divider theme-text-tertiary mt-4 flex items-center gap-4 border-t pt-3 text-xs">
                    <span className="inline-flex items-center gap-1.5"><Heart className="theme-danger size-3.5" />{work.likeCount}</span>
                    <span className="inline-flex items-center gap-1.5"><MessageCircle className="theme-accent size-3.5" />{work.commentCount}</span>
                  </div>
                </div>
              </article>;
            })}
          </div>
        )}
      </section>
    </main>
  );
}
