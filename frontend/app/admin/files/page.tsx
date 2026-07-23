"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import request from "@/lib/request";
import { type ApiResult, type ManagedFile, formatDate, formatSize } from "@/lib/admin";

export default function FileManage() {
  const [items, setItems] = useState<ManagedFile[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(() => request.get<never, ApiResult<ManagedFile[]>>("/admin/files")
    .then((result) => setItems(result.data)).catch(() => setError("文件列表加载失败。")), []);
  useEffect(() => { load(); }, [load]);
  async function remove(item: ManagedFile) {
    if (!confirm(`确认删除文件“${item.originalName}”？此操作不可恢复。`)) return;
    try { await request.delete(item.id ? `/admin/file/${item.id}` : `/admin/file?fileName=${encodeURIComponent(item.fileName)}`); load(); }
    catch { setError("文件删除失败。"); }
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  return <section><p className="text-sm text-violet-300">FILE MANAGEMENT</p><h1 className="mt-2 text-2xl font-semibold">文件管理</h1><p className="mt-2 text-sm text-slate-400">管理服务器 uploads 目录中的上传、像素化和导出图片资源。</p>{error && <p className="mt-5 text-sm text-rose-300">{error}</p>}<div className="mt-7 overflow-x-auto rounded-xl border border-white/[0.09] bg-[#15182a]"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-white/[0.08] text-slate-400"><tr><th className="p-4">文件名</th><th className="p-4">大小</th><th className="p-4">类型</th><th className="p-4">上传用户</th><th className="p-4">创建时间</th><th className="p-4">操作</th></tr></thead><tbody>{items.map((item) => <tr key={item.id ?? item.fileName} className="border-b border-white/[0.05] last:border-0"><td className="p-4"><p>{item.originalName}</p><p className="mt-1 text-xs text-slate-500">{item.fileName}</p></td><td className="p-4 text-slate-400">{formatSize(item.fileSize)}</td><td className="p-4"><span className="rounded bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200">{item.fileType}</span></td><td className="p-4">{item.username}</td><td className="p-4 text-slate-400">{formatDate(item.createTime)}</td><td className="p-4"><div className="flex gap-3"><a href={`${base}${item.url}`} target="_blank" title="预览" className="text-cyan-300"><ExternalLink className="size-4" /></a><button onClick={() => remove(item)} title="删除文件" className="text-rose-300"><Trash2 className="size-4" /></button></div></td></tr>)}{items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">暂无上传文件</td></tr>}</tbody></table></div></section>;
}
