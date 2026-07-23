"use client";

import { BarChart3, Image, Upload, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import request from "@/lib/request";
import type { ApiResult, Statistics } from "@/lib/admin";

const cards = [
  { key: "userCount", label: "用户总数", icon: UsersRound, color: "text-violet-300" },
  { key: "artworkCount", label: "作品总数", icon: Image, color: "text-cyan-300" },
  { key: "todayUpload", label: "今日上传", icon: Upload, color: "text-amber-300" },
  { key: "todayGenerate", label: "今日生成", icon: BarChart3, color: "text-emerald-300" },
] as const;

export default function AdminDashboard() {
  const [data, setData] = useState<Statistics | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { request.get<never, ApiResult<Statistics>>("/admin/statistics").then((result) => setData(result.data)).catch(() => setError("统计数据加载失败，请稍后重试。")); }, []);
  return <section><p className="text-sm text-violet-300">ADMIN CENTER</p><h1 className="mt-2 text-2xl font-semibold">数据统计</h1><p className="mt-2 text-sm text-slate-400">实时查看平台用户、作品和创作活动。</p>{error && <p className="mt-6 rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}<div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ key, label, icon: Icon, color }) => <article key={key} className="rounded-xl border border-white/[0.09] bg-[#15182a] p-5"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">{label}</span><Icon className={`size-5 ${color}`} /></div><strong className="mt-5 block text-3xl">{data ? data[key].toLocaleString() : "—"}</strong></article>)}</div></section>;
}
