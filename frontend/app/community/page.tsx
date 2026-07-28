"use client";

import Link from "next/link";
import { Clock3, Heart, ImageIcon, Sparkles, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CommunityArtworkCard from "@/components/community/CommunityArtworkCard";
import { Navbar } from "@/components/navbar";
import request from "@/lib/request";
import type { CommunityWork } from "@/lib/work";

interface ApiResponse<T> { code: number; msg: string; data: T; }
type CommunityTab = "latest" | "popular" | "featured";
const tabs: Array<{ id: CommunityTab; label: string; icon: typeof Clock3 }> = [{ id: "latest", label: "最新作品", icon: Clock3 }, { id: "popular", label: "热门作品", icon: Heart }, { id: "featured", label: "精选作品", icon: Trophy }];
const skeletonKeys = ["community-skeleton-1", "community-skeleton-2", "community-skeleton-3", "community-skeleton-4", "community-skeleton-5", "community-skeleton-6", "community-skeleton-7", "community-skeleton-8"];

function clientUuid() { return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function normalizeWorks(works: CommunityWork[]) {
  const keys = new Set<string>();
  return works.flatMap((work) => {
    const key = typeof work.id === "number" ? `artwork-${work.id}` : `artwork-${clientUuid()}`;
    if (keys.has(key)) return [];
    keys.add(key);
    return [{ ...work, uiKey: key }];
  });
}

export default function CommunityPage() {
  const [works, setWorks] = useState<CommunityWork[]>([]); const [activeTab, setActiveTab] = useState<CommunityTab>("latest"); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { request.get("/api/community/artworks").then((response) => { const result = response as unknown as ApiResponse<CommunityWork[]>; if (result.code !== 200) throw new Error(result.msg || "加载社区作品失败"); setWorks(normalizeWorks(result.data || [])); }).catch((reason) => setError(reason instanceof Error ? reason.message : "加载社区作品失败")).finally(() => setLoading(false)); }, []);
  const displayedWorks = useMemo(() => [...works].sort((left, right) => activeTab === "latest" ? new Date(right.createTime || 0).getTime() - new Date(left.createTime || 0).getTime() : (right.likeCount + right.modificationCount) - (left.likeCount + left.modificationCount)), [activeTab, works]);
  return <main className="theme-page grid-background min-h-screen px-4 pb-16 pt-28 sm:px-8"><Navbar /><section className="mx-auto max-w-7xl py-8 sm:py-12"><div className="theme-panel border px-5 py-7 shadow-2xl sm:px-8 sm:py-9"><p className="theme-accent text-xs font-semibold tracking-[0.2em]">PIXELVERSE COMMUNITY</p><div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="theme-text-primary text-3xl font-bold sm:text-4xl">社区画廊</h1><p className="theme-text-secondary mt-3 max-w-2xl text-sm leading-6">浏览公开的像素作品，与创作者一起继续构建数字世界。</p></div><div className="flex flex-wrap gap-2">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActiveTab(id)} aria-pressed={activeTab === id} className={`theme-filter inline-flex h-10 items-center gap-2 rounded-md border px-3.5 text-sm ${activeTab === id ? "theme-filter-active shadow-lg" : ""}`}><Icon className="size-4" />{label}</button>)}</div></div></div>{error && <p className="theme-error mt-7 rounded-md border px-4 py-3 text-sm">{error}</p>}{loading ? <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{skeletonKeys.map((key) => <div className="theme-skeleton h-[350px] animate-pulse rounded-lg border" key={key} />)}</div> : displayedWorks.length === 0 ? <div className="theme-card mt-8 grid min-h-72 place-items-center rounded-lg border border-dashed px-6 text-center"><div><ImageIcon className="theme-accent mx-auto size-9" /><p className="theme-text-secondary mt-4 text-sm">还没有已发布的作品</p><Link href="/workspace" className="theme-accent mt-4 inline-flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4" />开始创作</Link></div></div> : <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{displayedWorks.map((work) => <CommunityArtworkCard key={work.uiKey} work={work} />)}</div>}</section></main>;
}
