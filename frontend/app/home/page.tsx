"use client";

import { LogOut, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthUser, clearSession, getToken, getUser } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => { if (!getToken()) { router.replace("/login"); return; } setUser(getUser()); }, [router]);
  function logout() { clearSession(); router.replace("/login"); }
  if (!user) return <main className="grid min-h-screen place-items-center bg-[#08090d] text-sm text-zinc-500">正在验证登录状态...</main>;
  return <main className="grid-background min-h-screen bg-[#08090d] px-5 py-6 text-zinc-100 sm:px-8"><header className="mx-auto flex max-w-6xl items-center justify-between border-b border-white/[0.1] pb-5"><div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center bg-violet-500"><Sparkles className="size-4" /></span><span className="text-sm font-semibold">AI Pixel Studio</span></div><button className="inline-flex h-9 items-center gap-2 border border-white/[0.12] px-3 text-sm text-zinc-300 hover:border-white/[0.22] hover:text-white" onClick={logout}><LogOut className="size-4" />退出</button></header><section className="mx-auto max-w-6xl py-20 sm:py-28"><p className="text-sm text-violet-300">创作工作台</p><h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">你好，{user.nickname || user.username}</h1><p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400">你已经成功登录。像素画编辑器和 AI 图像生成能力可以在这里继续接入。</p></section></main>;
}
