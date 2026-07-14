"use client";

import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";

const links = ["首页", "作品展示", "关于我们"];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between border border-white/[0.1] bg-[#0d0e14]/80 px-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:px-5">
        <a className="flex items-center gap-2.5" href="#首页" aria-label="AI Pixel Studio 首页">
          <span className="grid size-8 place-items-center bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/20">
            <Sparkles className="size-4" strokeWidth={2.4} />
          </span>
          <span className="text-sm font-semibold tracking-[0.01em] text-white">AI Pixel Studio</span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a className="text-sm text-zinc-400 transition-colors hover:text-white" href={link === "首页" ? "#首页" : `#${link}`} key={link}>
              {link}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button className="h-9 px-4 text-sm text-zinc-300 transition-colors hover:text-white">登录</button>
          <button className="h-9 border border-violet-400/40 bg-violet-500 px-4 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400">注册</button>
        </div>

        <button className="grid size-9 place-items-center text-zinc-300 md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "关闭导航" : "打开导航"}>
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {menuOpen && (
        <div className="mx-auto max-w-6xl border-x border-b border-white/[0.1] bg-[#101119]/95 p-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <a className="px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.05] hover:text-white" href={link === "首页" ? "#首页" : `#${link}`} key={link} onClick={() => setMenuOpen(false)}>
                {link}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.08] pt-3">
              <button className="h-10 border border-white/[0.12] text-sm text-zinc-200">登录</button>
              <button className="h-10 bg-violet-500 text-sm font-medium text-white">注册</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
