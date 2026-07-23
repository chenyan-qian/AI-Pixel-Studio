"use client";

import { Eye, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import request from "@/lib/request";
import { type ApiResult, type Artwork, formatDate } from "@/lib/admin";

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
  return <section><p className="text-sm text-violet-300">ARTWORK MANAGEMENT</p><h1 className="mt-2 text-2xl font-semibold">作品管理</h1><p className="mt-2 text-sm text-slate-400">查看原始上传图与用户保存的最终像素作品数据。</p>{error && <p className="mt-5 text-sm text-rose-300">{error}</p>}<div className="mt-7 overflow-x-auto rounded-xl border border-white/[0.09] bg-[#15182a]"><table className="w-full min-w-[800px] text-left text-sm"><thead className="border-b border-white/[0.08] text-slate-400"><tr><th className="p-4">作品 ID</th><th className="p-4">标题</th><th className="p-4">所属用户</th><th className="p-4">像素规格</th><th className="p-4">创建时间</th><th className="p-4">操作</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-white/[0.05] last:border-0"><td className="p-4 text-slate-400">#{item.id}</td><td className="p-4">{item.title}</td><td className="p-4">{item.username}</td><td className="p-4 text-slate-400">{item.pixelSize}px</td><td className="p-4 text-slate-400">{formatDate(item.createTime)}</td><td className="p-4"><div className="flex gap-3"><button onClick={() => setSelected(item)} title="查看详情" className="text-cyan-300"><Eye className="size-4" /></button><button onClick={() => remove(item)} title="删除作品" className="text-rose-300"><Trash2 className="size-4" /></button></div></td></tr>)}{items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">暂无作品</td></tr>}</tbody></table></div>{selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setSelected(null)}><article className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl border border-white/[0.12] bg-[#15182a] p-6" onClick={(event) => event.stopPropagation()}><div className="flex justify-between"><h2 className="text-lg font-semibold">{selected.title}</h2><button onClick={() => setSelected(null)} className="text-slate-400">关闭</button></div><p className="mt-2 text-sm text-slate-400">作者：{selected.username} · 最后更新：{formatDate(selected.updateTime)}</p>{selected.sourceImageUrl ? <div className="mt-5"><p className="mb-2 text-xs text-slate-400">原始图片</p><img src={selected.sourceImageUrl} alt={`${selected.title} 原始图片`} className="max-h-64 rounded-lg border border-white/[0.1] object-contain" /></div> : <p className="mt-5 text-sm text-slate-500">该历史作品未保存原始图片路径。</p>}<p className="mt-5 text-xs text-slate-400">最终像素作品数据</p><pre className="mt-2 overflow-auto rounded-lg bg-black/30 p-4 text-xs text-cyan-100">{selected.finalPixelData}</pre></article></div>}</section>;
}
