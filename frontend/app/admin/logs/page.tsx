"use client";

import { useCallback, useEffect, useState } from "react";
import request from "@/lib/request";
import { type ApiResult, formatDate, type OperationLog } from "@/lib/admin";

export default function OperationLog() {
  const [items, setItems] = useState<OperationLog[]>([]); const [error, setError] = useState("");
  const load = useCallback(() => request.get<never, ApiResult<OperationLog[]>>("/admin/logs").then((r) => setItems(r.data)).catch(() => setError("操作日志加载失败。")), []);
  useEffect(() => { load(); }, [load]);
  return <section><p className="text-sm text-violet-300">AUDIT LOG</p><h1 className="mt-2 text-2xl font-semibold">操作日志</h1>{error && <p className="mt-5 text-sm text-rose-300">{error}</p>}<div className="mt-7 overflow-x-auto rounded-xl border border-white/[0.09] bg-[#15182a]"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-white/[0.08] text-slate-400"><tr><th className="p-4">日志 ID</th><th className="p-4">管理员</th><th className="p-4">操作内容</th><th className="p-4">操作时间</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-white/[0.05] last:border-0"><td className="p-4 text-slate-400">#{item.id}</td><td className="p-4">{item.username}</td><td className="p-4">{item.operation}</td><td className="p-4 text-slate-400">{formatDate(item.createTime)}</td></tr>)}{items.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">暂无操作日志</td></tr>}</tbody></table></div></section>;
}
