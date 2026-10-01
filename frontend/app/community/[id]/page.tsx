"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import ArtworkDetail from "@/components/community/ArtworkDetail";
import request from "@/lib/request";
import type { CommunityArtworkDetail } from "@/lib/work";

interface DetailResponse { code: number; msg: string; data: CommunityArtworkDetail; }
export default function CommunityArtworkPage() {
  const params = useParams<{ id: string }>(); const [detail, setDetail] = useState<DetailResponse["data"] | null>(null); const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setError("");
    request.get(`/api/community/artworks/${params.id}`).then((response) => {
      const result = response as unknown as DetailResponse;
      if (result.code !== 200) throw new Error(result.msg);
      if (!cancelled) setDetail(result.data);
    }).catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : "作品加载失败");
    });
    return () => { cancelled = true; };
  }, [params.id]);
  return <main className="theme-page grid-background min-h-screen pt-20"><Navbar />{error ? <p className="mx-auto max-w-6xl px-4 py-10 text-sm text-rose-300">{error}</p> : detail && detail.artwork.id.toString() === params.id ? <ArtworkDetail key={detail.artwork.id} {...detail} /> : <div className="grid min-h-[60vh] place-items-center text-sm text-zinc-500">正在加载作品...</div>}</main>;
}
