"use client";

import Link from "next/link";
import { ChevronDown, CircleUserRound, LogOut, Menu, Settings, Sparkles, UserRound, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type AuthUser, clearSession, getToken, getUser } from "@/lib/auth";

const links = [
  { label: "首页", href: "/" },
  { label: "作品展示", href: "/#showcase" },
  { label: "关于我们", href: "/#about" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getToken() ? getUser() : null);
  }, [pathname]);

  /** Clears every locally saved credential before returning to the public landing page. */
  function logout() {
    clearSession();
    setUser(null);
    setAccountOpen(false);
    setMenuOpen(false);
    router.replace("/");
  }

  const accountMenu = (
    <div className="border border-white/[0.12] bg-[#11131b] p-1.5 shadow-2xl shadow-black/40" role="menu">
      <Link className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.06] hover:text-white" href="/profile" role="menuitem" onClick={() => { setAccountOpen(false); setMenuOpen(false); }}><UserRound className="size-4 text-violet-300" />账户管理</Link>
      <span className="flex cursor-not-allowed items-center gap-2 px-3 py-2.5 text-sm text-zinc-600" aria-disabled="true"><CircleUserRound className="size-4" />我的作品（预留）</span>
      <span className="flex cursor-not-allowed items-center gap-2 px-3 py-2.5 text-sm text-zinc-600" aria-disabled="true"><Settings className="size-4" />设置（预留）</span>
      <div className="my-1 border-t border-white/[0.08]" />
      <button type="button" className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-rose-200 transition hover:bg-rose-400/10" onClick={logout} role="menuitem"><LogOut className="size-4" />退出登录</button>
    </div>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between border border-white/[0.1] bg-[#0d0e14]/80 px-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:px-5">
        <Link className="flex items-center gap-2.5" href="/" aria-label="AI Pixel Studio 首页"><span className="grid size-8 place-items-center bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/20"><Sparkles className="size-4" strokeWidth={2.4} /></span><span className="text-sm font-semibold tracking-[0.01em] text-white">AI Pixel Studio</span></Link>
        <div className="hidden items-center gap-7 md:flex">{links.map((link) => <Link className="text-sm text-zinc-400 transition-colors hover:text-white" href={link.href} key={link.href}>{link.label}</Link>)}</div>
        <div className="hidden items-center gap-2 md:flex">
          {user ? <div className="relative"><button type="button" className="flex h-9 items-center gap-2 border border-white/[0.12] px-3 text-sm text-zinc-200 transition hover:border-violet-300/50 hover:text-white" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-haspopup="menu"><UserRound className="size-4 text-violet-300" />{user.username}<ChevronDown className={`size-3.5 transition ${accountOpen ? "rotate-180" : ""}`} /></button>{accountOpen && <div className="absolute right-0 top-11 z-20 w-48">{accountMenu}</div>}</div> : <><Link className="flex h-9 items-center px-4 text-sm text-zinc-300 transition-colors hover:text-white" href="/login">登录</Link><Link className="flex h-9 items-center border border-violet-400/40 bg-violet-500 px-4 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400" href="/register">注册</Link></>}
        </div>
        <button type="button" className="grid size-9 place-items-center text-zinc-300 md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "关闭导航" : "打开导航"}>{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
      </nav>
      {menuOpen && <div className="mx-auto max-w-6xl border-x border-b border-white/[0.1] bg-[#101119]/95 p-4 backdrop-blur-xl md:hidden"><div className="flex flex-col gap-1">{links.map((link) => <Link className="px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.05] hover:text-white" href={link.href} key={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link>)}{user ? <div className="mt-2 border-t border-white/[0.08] pt-3">{accountMenu}</div> : <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.08] pt-3"><Link className="flex h-10 items-center justify-center border border-white/[0.12] text-sm text-zinc-200" href="/login" onClick={() => setMenuOpen(false)}>登录</Link><Link className="flex h-10 items-center justify-center bg-violet-500 text-sm font-medium text-white" href="/register" onClick={() => setMenuOpen(false)}>注册</Link></div>}</div></div>}
    </header>
  );
}
