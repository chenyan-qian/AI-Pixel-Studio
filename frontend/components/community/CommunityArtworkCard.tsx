"use client";

import Link from "next/link";
import { Heart, ImageIcon, PencilLine, Users } from "lucide-react";
import { absoluteImageUrl, type CommunityWork } from "@/lib/work";

export default function CommunityArtworkCard({ work }: { work: CommunityWork }) {
  const imageUrl = absoluteImageUrl(work.imageUrl);
  const initial = work.username.trim().charAt(0).toUpperCase() || "P";
  return <article className="theme-artwork-card group overflow-hidden rounded-lg border shadow-xl transition duration-300 hover:-translate-y-1 hover:scale-[1.015]">
    <Link href={`/community/${work.id}`} className="theme-artwork-image relative block aspect-[4/3] overflow-hidden shadow-[inset_0_-28px_32px_var(--overlay-color)]">
      {imageUrl ? <img src={imageUrl} alt={work.title} className="size-full object-cover shadow-2xl transition duration-500 group-hover:scale-105 [image-rendering:pixelated]" /> : <div className="grid size-full place-items-center"><ImageIcon className="theme-text-tertiary size-9" /></div>}
      <span className="theme-image-meta absolute left-3 top-3 rounded-md border px-2 py-1 text-[11px] font-medium backdrop-blur-sm">{work.width} x {work.height}</span>
      {work.collaborationEnabled && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded border border-cyan-300/50 bg-[#08121a]/85 px-2 py-1 text-[11px] text-cyan-100"><PencilLine className="size-3" />加入创作</span>}
    </Link>
    <div className="p-4"><div className="flex items-center justify-between gap-3"><h2 className="theme-text-primary truncate text-base font-semibold" title={work.title}>{work.title}</h2><span className="theme-size-tag shrink-0 rounded border px-1.5 py-1 text-[10px]">{work.pixelSize}px</span></div>
      <div className="mt-4 flex items-center gap-2.5">{work.avatar ? <img src={absoluteImageUrl(work.avatar) || undefined} alt="作者头像" className="theme-decoration-border size-8 rounded-full border object-cover" /> : <span className="theme-avatar grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold">{initial}</span>}<div className="min-w-0 flex-1"><p className="theme-text-primary truncate text-sm font-medium">{work.username}</p><p className="theme-text-tertiary mt-0.5 text-[11px]">{work.createTime ? new Date(work.createTime).toLocaleDateString("zh-CN") : "刚刚发布"}</p></div></div>
      <div className="theme-divider theme-text-tertiary mt-4 flex items-center justify-between border-t pt-3 text-xs"><span className="inline-flex items-center gap-1.5"><Heart className="theme-danger size-3.5" />{work.likeCount}</span><span className="inline-flex items-center gap-1.5"><Users className="text-cyan-300 size-3.5" />{work.onlineCount} 在线</span><span>{work.modificationCount} 次修改</span></div>
    </div>
  </article>;
}
