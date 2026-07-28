"use client";

import Link from "next/link";
import { ChevronDown, CircleUserRound, LogOut, Menu, Settings, Sparkles, UserRound, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type AuthUser, clearSession, getToken, getUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { label: "首页", href: "/" },
  { label: "创作", href: "/workspace" },
  { label: "社区", href: "/community" },
  { label: "作品", href: "/works" },
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
    <div className="theme-menu pixel-corners border p-1.5 shadow-2xl backdrop-blur-xl" role="menu">
      <Link className="theme-nav-link flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition" href="/profile" role="menuitem" onClick={() => { setAccountOpen(false); setMenuOpen(false); }}><UserRound className="theme-accent size-4" />账户管理</Link>
      <Link className="theme-nav-link flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition" href="/works" role="menuitem" onClick={() => { setAccountOpen(false); setMenuOpen(false); }}><CircleUserRound className="theme-accent size-4" />我的作品</Link>
      <Link className="theme-nav-link flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition" href="/settings" role="menuitem" onClick={() => { setAccountOpen(false); setMenuOpen(false); }}><Settings className="theme-accent size-4" />设置</Link>
      <div className="theme-divider my-1 border-t" />
      <button type="button" className="theme-error flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition" onClick={logout} role="menuitem"><LogOut className="size-4" />退出登录</button>
    </div>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav className="theme-nav mx-auto flex h-[66px] max-w-6xl items-center justify-between border px-4 shadow-xl backdrop-blur-xl sm:px-5">
        <Link className="flex min-w-0 items-center gap-2.5" href="/" aria-label="PixelVerse 首页">
          <span className="theme-avatar grid size-9 shrink-0 place-items-center rounded-md border shadow-lg"><Sparkles className="size-4" strokeWidth={2.5} /></span>
          <span className="min-w-0"><span className="theme-text-primary block text-sm font-bold tracking-wide">PixelVerse</span><span className="theme-accent hidden text-[10px] sm:block">Create Your Pixel World</span></span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">{links.map((link) => <Link className="theme-nav-link rounded-md px-3 py-2 text-sm transition-colors" href={link.href} key={link.href}>{link.label}</Link>)}</div>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? <div className="relative"><button type="button" className="theme-account-button flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-haspopup="menu"><UserRound className="theme-accent size-4" />{user.nickname || user.username}<ChevronDown className={`size-3.5 transition ${accountOpen ? "rotate-180" : ""}`} /></button>{accountOpen && <div className="absolute right-0 top-11 z-20 w-52">{accountMenu}</div>}</div> : <><Link className="theme-nav-link flex h-9 items-center rounded-md px-4 text-sm transition-colors" href="/login">登录</Link><Link className="glow-button flex h-9 items-center rounded-md px-4 text-sm font-medium" href="/register">注册</Link></>}
        </div>
        <button type="button" className="theme-nav-link grid size-9 place-items-center rounded-md md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "关闭导航" : "打开导航"}>{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
      </nav>
      {menuOpen && <div className="theme-menu pixel-corners mx-auto max-w-6xl border-x border-b p-3 shadow-xl backdrop-blur-xl md:hidden"><div className="flex flex-col gap-1">{links.map((link) => <Link className="theme-nav-link rounded-md px-3 py-2.5 text-sm" href={link.href} key={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link>)}{user ? <div className="theme-divider mt-2 border-t pt-3">{accountMenu}</div> : <div className="theme-divider mt-2 grid grid-cols-2 gap-2 border-t pt-3"><Link className="theme-nav-link flex h-10 items-center justify-center rounded-md border" href="/login" onClick={() => setMenuOpen(false)}>登录</Link><Link className="glow-button flex h-10 items-center justify-center rounded-md text-sm font-medium" href="/register" onClick={() => setMenuOpen(false)}>注册</Link></div>}</div></div>}
    </header>
  );
}
