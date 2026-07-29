"use client";

import { Check, Eye, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import request from "@/lib/request";
import { type ApiResult, type Artwork, formatDate } from "@/lib/admin";
import { absoluteImageUrl } from "@/lib/work";

export default function ArtworkManage() {
  const [items, setItems] = useState<Artwork[]>([]);
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => request.get<never, ApiResult<Artwork[]>>("/admin/artworks")
    .then((result) => setItems(result.data)).catch(() => setError("作品列表加载失败。")), []);
  useEffect(() => { load(); }, [load]);
  async function remove(item: Artwork) {
    if (!confirm(`确认删除作品“${item.title}”？`)) return;
    try { await request.delete(`/admin/artwork/${item.id}`); setSelected(null); load(); }
    catch { setError("删除失败，请稍后重试。"); }
  }
  async function review(item: Artwork, approved: boolean) {
    const reviewNote = approved ? "" : window.prompt("填写驳回原因（可选）") || "";
    try { await request.put(`/admin/artwork/${item.id}/review`, { approved, reviewNote }); load(); }
    catch { setError("审核操作失败，请稍后重试。"); }
  }
  const statusLabel = (status: Artwork["reviewStatus"]) => ({ DRAFT: "草稿", PENDING: "待审核", PUBLISHED: "已发布", REJECTED: "已驳回" })[status];
  return <section><p className="text-sm text-violet-300">ARTWORK REVIEW</p><h1 className="mt-2 text-2xl font-semibold">作品审核</h1><p className="mt-2 text-sm text-slate-400">仅显示用户已提交审核或已处理的作品；草稿仅作者本人可见。</p>{error && <p className="mt-5 text-sm text-rose-300">{error}</p>}<div className="mt-7 overflow-x-auto rounded-xl border border-white/[0.09] bg-[#15182a]"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-white/[0.08] text-slate-400"><tr><th className="p-4">作品 ID</th><th className="p-4">标题</th><th className="p-4">所属用户</th><th className="p-4">状态</th><th className="p-4">创建时间</th><th className="p-4">操作</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-white/[0.05] last:border-0"><td className="p-4 text-slate-400">#{item.id}</td><td className="p-4">{item.title}</td><td className="p-4">{item.username}</td><td className="p-4"><span className={item.reviewStatus === "PUBLISHED" ? "text-emerald-300" : item.reviewStatus === "PENDING" ? "text-amber-300" : item.reviewStatus === "REJECTED" ? "text-rose-300" : "text-slate-400"}>{statusLabel(item.reviewStatus)}</span></td><td className="p-4 text-slate-400">{formatDate(item.createTime)}</td><td className="p-4"><div className="flex gap-3"><button onClick={() => setSelected(item)} title="查看详情" className="text-cyan-300"><Eye className="size-4" /></button>{item.reviewStatus === "PENDING" && <><button onClick={() => review(item, true)} title="审核通过" className="text-emerald-300"><Check className="size-4" /></button><button onClick={() => review(item, false)} title="驳回作品" className="text-amber-300"><X className="size-4" /></button></>}<button onClick={() => remove(item)} title="删除作品" className="text-rose-300"><Trash2 className="size-4" /></button></div></td></tr>)}{items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">暂无作品</td></tr>}</tbody></table></div>{selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setSelected(null)}><article className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl border border-white/[0.12] bg-[#15182a] p-6" onClick={(event) => event.stopPropagation()}><div className="flex justify-between"><h2 className="text-lg font-semibold">{selected.title}</h2><button onClick={() => setSelected(null)} className="text-slate-400">关闭</button></div><p className="mt-2 text-sm text-slate-400">作者：{selected.username} · 审核状态：{statusLabel(selected.reviewStatus)}</p>{(selected.pixelImageUrl || selected.sourceImageUrl) ? <div className="mt-5"><p className="mb-2 text-xs text-slate-400">像素作品预览</p><img src={absoluteImageUrl(selected.pixelImageUrl || selected.sourceImageUrl)!} alt={`${selected.title} 预览`} className="max-h-64 rounded-lg border border-white/[0.1] object-contain" /></div> : null}{selected.reviewNote && <p className="mt-4 text-sm text-rose-300">审核意见：{selected.reviewNote}</p>}</article></div>}</section>;
}
