"use client";

import { CalendarDays, Mail, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { type AuthUser, clearSession, getToken, getUser } from "@/lib/auth";

/** 账户展示页，后续接入资料接口后再开放可编辑能力。 */
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    const savedUser = getToken() ? getUser() : null;
    if (!savedUser) {
      clearSession();
      router.replace("/login");
      return;
    }
    setUser(savedUser);
    setCheckedAuth(true);
  }, [router]);

  if (!checkedAuth || !user) return <main className="grid min-h-screen place-items-center bg-[#08090d] text-sm text-zinc-500">正在验证登录状态…</main>;

  const displayName = user.nickname || user.username;
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <main className="grid-background min-h-screen bg-[#08090d] px-5 pb-12 pt-28 text-zinc-100 sm:px-8">
      <Navbar />
      <section className="mx-auto max-w-4xl py-8 sm:py-12" aria-labelledby="profile-title">
        <p className="text-sm text-violet-300">账户管理</p>
        <h1 id="profile-title" className="mt-3 text-3xl font-semibold text-white sm:text-4xl">个人资料</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">查看你的账户信息；资料编辑功能将在后续版本开放。</p>
        <div className="mt-9 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border border-white/[0.12] bg-[#10111a]/90 p-6 text-center shadow-2xl shadow-black/20 backdrop-blur">
            {user.avatar ? <img className="mx-auto size-24 rounded-full border border-violet-300/30 object-cover" src={user.avatar} alt={`${displayName} 的头像`} /> : <div className="mx-auto grid size-24 place-items-center rounded-full border border-violet-300/30 bg-violet-400/10 text-3xl font-semibold text-violet-200">{initial}</div>}
            <h2 className="mt-5 text-lg font-semibold text-white">{displayName}</h2>
            <p className="mt-1 text-sm text-zinc-500">@{user.username}</p>
          </aside>
          <div className="border border-white/[0.12] bg-[#10111a]/90 p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-7">
            <dl className="divide-y divide-white/[0.08]">
              <div className="flex gap-4 py-4 first:pt-0"><UserRound className="mt-0.5 size-5 shrink-0 text-violet-300" /><div><dt className="text-sm text-zinc-500">用户名</dt><dd className="mt-1 text-sm text-zinc-100">{user.username}</dd></div></div>
              <div className="flex gap-4 py-4"><UserRound className="mt-0.5 size-5 shrink-0 text-violet-300" /><div><dt className="text-sm text-zinc-500">昵称</dt><dd className="mt-1 text-sm text-zinc-100">{displayName}</dd></div></div>
              <div className="flex gap-4 py-4"><Mail className="mt-0.5 size-5 shrink-0 text-zinc-600" /><div><dt className="text-sm text-zinc-500">邮箱（预留）</dt><dd className="mt-1 text-sm text-zinc-500">暂未设置</dd></div></div>
              <div className="flex gap-4 pb-0 pt-4"><CalendarDays className="mt-0.5 size-5 shrink-0 text-zinc-600" /><div><dt className="text-sm text-zinc-500">注册时间</dt><dd className="mt-1 text-sm text-zinc-500">当前登录接口暂未提供注册时间</dd></div></div>
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
