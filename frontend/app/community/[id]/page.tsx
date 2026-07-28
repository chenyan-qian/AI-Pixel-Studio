"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import ArtworkDetail from "@/components/community/ArtworkDetail";
import request from "@/lib/request";
import type { WorkRecord } from "@/lib/work";

interface DetailResponse { code: number; msg: string; data: { artwork: WorkRecord; username: string; avatar: string | null; permission: { visibility: "PRIVATE" | "PUBLIC" | "PUBLIC_COLLAB"; allowEdit: boolean; allowFork: boolean }; onlineCount: number; modificationCount: number; contributors: Array<{ userId: number; username: string; avatar: string | null; pixelCount: number }> }; }
export default function CommunityArtworkPage() {
  const params = useParams<{ id: string }>(); const [detail, setDetail] = useState<DetailResponse["data"] | null>(null); const [error, setError] = useState("");
  useEffect(() => { request.get(`/api/community/artworks/${params.id}`).then((response) => { const result = response as unknown as DetailResponse; if (result.code !== 200) throw new Error(result.msg); setDetail(result.data); }).catch((reason) => setError(reason instanceof Error ? reason.message : "作品加载失败")); }, [params.id]);
  return <main className="theme-page grid-background min-h-screen pt-20"><Navbar />{error ? <p className="mx-auto max-w-6xl px-4 py-10 text-sm text-rose-300">{error}</p> : detail ? <ArtworkDetail {...detail} /> : <div className="grid min-h-[60vh] place-items-center text-sm text-zinc-500">正在加载作品...</div>}</main>;
}
