"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, FileImage, LogOut, Menu, ShieldCheck, UsersRound, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { clearSession, refreshSession } from "@/lib/auth";

const navigation = [
  { href: "/admin", label: "数据统计", icon: BarChart3 }, { href: "/admin/users", label: "用户管理", icon: UsersRound },
  { href: "/admin/artworks", label: "作品管理", icon: FileImage }, { href: "/admin/files", label: "文件管理", icon: FileImage }, { href: "/admin/logs", label: "操作日志", icon: ShieldCheck },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter();
  const [ready, setReady] = useState(false); const [open, setOpen] = useState(false); const [username, setUsername] = useState("");
  useEffect(() => {
    let cancelled = false;
    refreshSession().then((user) => {
      if (cancelled) return;
      if (!user || user.role !== "ADMIN") { router.replace("/"); return; }
      setUsername(user.username);
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [router]);
  function logout() { clearSession(); router.replace("/login"); }
  if (!ready) return <main className="grid min-h-screen place-items-center bg-slate-950 text-sm text-slate-400">正在验证管理员权限…</main>;
  const menu = <nav className="space-y-1 p-3">{navigation.map(({ href, label, icon: Icon }) => {
    const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
    return <Link onClick={() => setOpen(false)} key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-violet-500 text-white shadow-lg shadow-violet-950/40" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}><Icon className="size-4" />{label}</Link>;
  })}</nav>;
  return <div className="min-h-screen bg-slate-950 text-slate-100"><aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-white/[0.08] bg-[#101222] md:block"><div className="flex h-16 items-center gap-2 border-b border-white/[0.08] px-5 font-semibold"><ShieldCheck className="size-5 text-violet-300" />AI Pixel Admin</div>{menu}</aside>{open && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)}><aside className="h-full w-64 bg-[#101222]" onClick={(event) => event.stopPropagation()}><div className="flex h-16 items-center justify-between border-b border-white/[0.08] px-5 font-semibold"><span>AI Pixel Admin</span><button onClick={() => setOpen(false)}><X className="size-5" /></button></div>{menu}</aside></div>}<div className="md:pl-60"><header className="flex h-16 items-center justify-between border-b border-white/[0.08] bg-[#101222]/80 px-4 backdrop-blur md:px-8"><button className="md:hidden" onClick={() => setOpen(true)}><Menu className="size-5" /></button><div className="ml-auto flex items-center gap-4 text-sm"><ThemeToggle /><span className="text-slate-300">管理员：{username}</span><button onClick={logout} className="inline-flex items-center gap-1.5 text-slate-400 hover:text-rose-300"><LogOut className="size-4" />退出登录</button></div></header><main className="mx-auto max-w-7xl p-5 md:p-8">{children}</main></div></div>;
}
