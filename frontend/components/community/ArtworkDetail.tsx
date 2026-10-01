"use client";

import Link from "next/link";
import { Bookmark, Copy, Heart, History, LoaderCircle, PencilLine, RotateCcw, Share2, Users } from "lucide-react";
import { useRef, useState } from "react";
import { exportPixelImage } from "@/lib/pixel-export";
import request from "@/lib/request";
import { absoluteImageUrl, type CommunityArtworkDetail, type CommunityVersion } from "@/lib/work";

interface VersionResponse { code: number; msg: string; data: { id: number; versionNumber: number; pixelData: string }; }

export default function ArtworkDetail({ artwork, username, avatar, permission, onlineCount, modificationCount, latestVersion, versions, contributors }: CommunityArtworkDetail) {
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<CommunityVersion | null>(null);
  const [versionPreview, setVersionPreview] = useState<string | null>(null);
  const [loadingVersionId, setLoadingVersionId] = useState<number | null>(null);
  const [previewError, setPreviewError] = useState("");
  const selectionSerial = useRef(0);
  const canCollaborate = permission.visibility === "PUBLIC_COLLAB" && permission.allowEdit;
  const currentImage = absoluteImageUrl(artwork.pixelImageUrl || artwork.sourceImageUrl);
  const share = async () => { await navigator.clipboard?.writeText(window.location.href); };

  function showCurrent() {
    selectionSerial.current += 1;
    setSelectedVersion(null);
    setVersionPreview(null);
    setLoadingVersionId(null);
    setPreviewError("");
  }

  async function showVersion(version: CommunityVersion) {
    const serial = ++selectionSerial.current;
    setLoadingVersionId(version.id);
    setPreviewError("");
    try {
      const response = await request.get(`/api/community/artworks/${artwork.id}/versions/${version.id}`) as unknown as VersionResponse;
      if (response.code !== 200 || response.data.id !== version.id) throw new Error(response.msg || "版本加载失败");
      const snapshot = JSON.parse(response.data.pixelData) as {
        pixelGrid: string[][]; pixelSoftness: number[][]; pixelOverrides: boolean[][];
      };
      if (!Array.isArray(snapshot.pixelGrid) || snapshot.pixelGrid.length !== version.height
          || snapshot.pixelGrid.some((row) => !Array.isArray(row) || row.length !== version.width)
          || !Array.isArray(snapshot.pixelSoftness) || !Array.isArray(snapshot.pixelOverrides)) {
        throw new Error("版本画布数据不完整");
      }
      const sourceImageUrl = absoluteImageUrl(artwork.sourceImageUrl) || null;
      const exportOptions = {
        ...snapshot,
        gridWidth: version.width,
        gridHeight: version.height,
        canvasWidth: artwork.canvasWidth,
        canvasHeight: artwork.canvasHeight,
        sourceWidth: artwork.imageWidth,
        sourceHeight: artwork.imageHeight,
        mimeType: "image/png" as const,
      };
      const image = sourceImageUrl
        ? await exportPixelImage({ ...exportOptions, sourceImageUrl }).catch(() => exportPixelImage({ ...exportOptions, sourceImageUrl: null }))
        : await exportPixelImage({ ...exportOptions, sourceImageUrl: null });
      if (serial !== selectionSerial.current) return;
      setVersionPreview(image);
      setSelectedVersion(version);
    } catch (error) {
      if (serial === selectionSerial.current) setPreviewError(error instanceof Error ? error.message : "版本加载失败");
    } finally {
      if (serial === selectionSerial.current) setLoadingVersionId(null);
    }
  }

  return <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <div className="overflow-hidden rounded-lg border border-white/[0.1] bg-[#11131c]">
          <div className="aspect-[4/3] bg-[linear-gradient(45deg,rgba(255,255,255,.03)_25%,transparent_25%,transparent_75%,rgba(255,255,255,.03)_75%)] bg-[length:18px_18px]">
            {(versionPreview || currentImage) && <img src={versionPreview || currentImage || undefined} alt={selectedVersion ? `${artwork.title} V${selectedVersion.versionNumber}` : artwork.title} className="size-full object-contain [image-rendering:pixelated]" />}
          </div>
        </div>
        <div className="mt-3 flex min-h-6 items-center gap-3 text-xs text-zinc-400" aria-live="polite">
          <span>{selectedVersion ? `历史版本 V${selectedVersion.versionNumber}` : "当前作品"}</span>
          {loadingVersionId !== null && <span className="inline-flex items-center gap-1 text-cyan-300"><LoaderCircle className="size-3 animate-spin" />正在加载版本</span>}
          {previewError && <span className="text-rose-300">{previewError}</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/community/${artwork.id}/edit`} aria-disabled={!canCollaborate} className={`inline-flex h-10 items-center gap-2 border px-4 text-sm ${canCollaborate ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20" : "pointer-events-none border-white/[0.1] text-zinc-500"}`}><PencilLine className="size-4" />{canCollaborate ? "参与创作" : "仅展示"}</Link>
          <button type="button" onClick={() => setSaved(!saved)} title="收藏作品" className={`grid size-10 place-items-center border ${saved ? "border-amber-300/60 text-amber-200" : "border-white/[0.14] text-zinc-300"}`}><Bookmark className="size-4" /></button>
          <button type="button" onClick={() => setLiked(!liked)} title="点赞作品" className={`grid size-10 place-items-center border ${liked ? "border-rose-400/60 text-rose-300" : "border-white/[0.14] text-zinc-300"}`}><Heart className="size-4" /></button>
          <button type="button" onClick={share} title="分享作品" className="grid size-10 place-items-center border border-white/[0.14] text-zinc-300"><Share2 className="size-4" /></button>
          {permission.allowFork && <Link href={`/editor?workId=${artwork.id}`} title="基于当前版本创建自己的作品" className="grid size-10 place-items-center border border-white/[0.14] text-zinc-300"><Copy className="size-4" /></Link>}
        </div>
      </div>
      <aside className="border border-white/[0.1] bg-[#11131c] p-5">
        <p className="text-xs tracking-[0.18em] text-cyan-300">COMMUNITY ARTWORK</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">{artwork.title}</h1>
        <div className="mt-5 flex items-center gap-3">
          {avatar ? <img src={absoluteImageUrl(avatar) || undefined} alt="作者头像" className="size-10 rounded-full object-cover" /> : <span className="grid size-10 place-items-center rounded-full bg-violet-600 text-sm font-semibold">{username.charAt(0).toUpperCase()}</span>}
          <div><p className="text-sm font-medium">{username}</p><p className="text-xs text-zinc-500">发布于 {artwork.publishedTime ? new Date(artwork.publishedTime).toLocaleDateString("zh-CN") : new Date(artwork.createTime).toLocaleDateString("zh-CN")}</p></div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 border-y border-white/[0.1] py-4 text-sm">
          <div><dt className="text-zinc-500">在线创作者</dt><dd className="mt-1 flex items-center gap-1 text-cyan-200"><Users className="size-4" />{onlineCount}</dd></div>
          <div><dt className="text-zinc-500">修改次数</dt><dd className="mt-1 text-white">{modificationCount}</dd></div>
        </dl>
        <div className="mt-5">
          <h2 className="text-sm font-medium">贡献者</h2>
          <div className="mt-3 space-y-2">{contributors.length ? contributors.map((contributor) => <div key={contributor.userId} className="flex justify-between text-xs"><span className="text-zinc-300">{contributor.username}</span><span className="text-zinc-500">修改 {contributor.pixelCount} 像素</span></div>) : <p className="text-xs text-zinc-600">等待第一位协作者</p>}</div>
        </div>
        <div className="mt-6 border-t border-white/[0.1] pt-5">
          <div className="flex items-center justify-between gap-2"><h2 className="inline-flex items-center gap-2 text-sm font-medium"><History className="size-4 text-cyan-300" />历史版本</h2>{latestVersion && <span className="text-xs text-zinc-500">最新保存 V{latestVersion.versionNumber}</span>}</div>
          {versions.length > 0 && <button type="button" onClick={showCurrent} aria-pressed={selectedVersion === null} className={`mt-3 flex w-full items-center gap-2 border px-3 py-2 text-left text-xs ${selectedVersion === null ? "border-cyan-400/40 text-cyan-200" : "border-white/[0.1] text-zinc-300 hover:border-white/[0.2]"}`}><RotateCcw className="size-3.5" />当前作品</button>}
          <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
            {versions.map((version) => <button key={version.id} type="button" onClick={() => void showVersion(version)} disabled={loadingVersionId === version.id} aria-pressed={selectedVersion?.id === version.id} className={`w-full border px-3 py-2 text-left text-xs ${selectedVersion?.id === version.id ? "border-cyan-400/40 text-cyan-200" : "border-white/[0.1] text-zinc-300 hover:border-white/[0.2]"} disabled:cursor-wait`}><span className="block truncate font-medium">V{version.versionNumber} · {version.description}</span><span className="mt-1 block text-zinc-500">{version.creator} · {new Date(version.createTime).toLocaleString("zh-CN")}</span></button>)}
            {versions.length === 0 && <p className="py-3 text-xs text-zinc-600">尚无历史版本</p>}
          </div>
        </div>
      </aside>
    </div>
  </section>;
}
