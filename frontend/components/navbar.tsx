"use client";

import Link from "next/link";
import { ChevronDown, CircleUserRound, LogOut, Menu, Settings, Sparkles, UserRound, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type AuthUser, clearSession, getToken, getUser } from "@/lib/auth";

const links = [
  { label: "首页", href: "/" },
  { label: "创作", href: "/workspace" },
  { label: "社区", href: "/#community" },
  { label: "作品", href: "/#works" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => setUser(getToken() ? getUser() : null), [pathname]);

  function logout() {
    clearSession();
    setUser(null);
    setAccountOpen(false);
    setMenuOpen(false);
    router.replace("/");
  }

  const accountMenu = (
    <div className="pixel-corners border border-cyan-200/15 bg-[#12132a]/95 p-1.5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl" role="menu">
      <Link className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.07] hover:text-white" href="/profile" role="menuitem" onClick={() => { setAccountOpen(false); setMenuOpen(false); }}><UserRound className="size-4 text-cyan-300" />账户管理</Link>
      <span className="flex cursor-not-allowed items-center gap-2 px-3 py-2.5 text-sm text-zinc-600" aria-disabled="true"><CircleUserRound className="size-4" />我的作品（即将开放）</span>
      <span className="flex cursor-not-allowed items-center gap-2 px-3 py-2.5 text-sm text-zinc-600" aria-disabled="true"><Settings className="size-4" />设置（即将开放）</span>
      <div className="my-1 border-t border-white/[0.08]" />
      <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-rose-200 transition hover:bg-rose-400/10" onClick={logout} role="menuitem"><LogOut className="size-4" />退出登录</button>
    </div>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav className="pixel-corners mx-auto flex h-[66px] max-w-6xl items-center justify-between border border-white/[0.11] bg-[#101120]/80 px-4 shadow-xl shadow-black/20 backdrop-blur-xl sm:px-5">
        <Link className="flex min-w-0 items-center gap-2.5" href="/" aria-label="PixelVerse 首页">
          <span className="grid size-9 shrink-0 place-items-center rounded-md border border-cyan-200/30 bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/20"><Sparkles className="size-4" strokeWidth={2.5} /></span>
          <span className="min-w-0"><span className="block text-sm font-bold tracking-wide text-white">PixelVerse</span><span className="hidden text-[10px] text-cyan-200/75 sm:block">Create Your Pixel World</span></span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">{links.map((link) => <Link className="rounded-md px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-cyan-100" href={link.href} key={link.href}>{link.label}</Link>)}</div>
        <div className="hidden items-center gap-2 md:flex">
          {user ? <div className="relative"><button type="button" className="flex h-9 items-center gap-2 rounded-md border border-cyan-200/20 bg-white/[0.03] px-3 text-sm text-zinc-200 transition hover:border-cyan-300/50 hover:text-white" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-haspopup="menu"><UserRound className="size-4 text-cyan-300" />{user.nickname || user.username}<ChevronDown className={`size-3.5 transition ${accountOpen ? "rotate-180" : ""}`} /></button>{accountOpen && <div className="absolute right-0 top-11 z-20 w-52">{accountMenu}</div>}</div> : <><Link className="flex h-9 items-center rounded-md px-4 text-sm text-zinc-300 transition-colors hover:text-white" href="/login">登录</Link><Link className="glow-button flex h-9 items-center rounded-md px-4 text-sm font-medium text-white" href="/register">注册</Link></>}
        </div>
        <button type="button" className="grid size-9 place-items-center rounded-md text-zinc-300 hover:bg-white/[0.06] md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "关闭导航" : "打开导航"}>{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
      </nav>
      {menuOpen && <div className="pixel-corners mx-auto max-w-6xl border-x border-b border-white/[0.1] bg-[#101120]/95 p-3 shadow-xl shadow-black/20 backdrop-blur-xl md:hidden"><div className="flex flex-col gap-1">{links.map((link) => <Link className="rounded-md px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.05] hover:text-white" href={link.href} key={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link>)}{user ? <div className="mt-2 border-t border-white/[0.08] pt-3">{accountMenu}</div> : <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.08] pt-3"><Link className="flex h-10 items-center justify-center rounded-md border border-white/[0.12] text-sm text-zinc-200" href="/login" onClick={() => setMenuOpen(false)}>登录</Link><Link className="glow-button flex h-10 items-center justify-center rounded-md text-sm font-medium text-white" href="/register" onClick={() => setMenuOpen(false)}>注册</Link></div>}</div></div>}
    </header>
  );
}
