"use client";

import { ArrowRight, ImagePlus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/auth";

const pixels = ["#6d5dfc", "#33d7ff", "#8f6bff", "#30e6c4", "#1d2b64", "#f7b267", "#5f4bb6", "#c4f0ff", "#3f51b5", "#30e6c4", "#f25f9c", "#6d5dfc", "#22305d", "#75d6ff", "#8f6bff", "#f7b267"];

export function Hero() {
  const router = useRouter();
  function openWorkspace() { router.push(getToken() && getUser() ? "/workspace" : "/login"); }

  return (
    <section className="hero-grid relative isolate overflow-hidden px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40" id="home">
      <div className="pixel-float pixel-float-one" /><div className="pixel-float pixel-float-two" /><div className="pixel-float pixel-float-three" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        <div className="relative z-10">
          <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-medium text-cyan-100"><span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" />多人像素艺术创作平台</div>
          <p className="animate-rise animation-delay-100 mt-7 text-sm font-semibold tracking-[0.24em] text-violet-300">PIXELVERSE</p>
          <h1 className="animate-rise animation-delay-100 mt-3 text-4xl font-bold leading-[1.12] text-white sm:text-5xl lg:text-6xl">创造属于你的<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-cyan-200 to-blue-300">像素世界</span></h1>
          <p className="animate-rise animation-delay-200 mt-6 max-w-xl text-base leading-8 text-zinc-400 sm:text-lg">将图片转化为独特的像素艺术，<br className="hidden sm:block" />并与其他创作者共同探索无限可能。</p>
          <div className="animate-rise animation-delay-200 mt-9 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={openWorkspace} className="glow-button inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold text-white"><ImagePlus className="size-4" />开始创作<ArrowRight className="size-4" /></button>
            <a href="/community" className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/[0.15] bg-white/[0.04] px-6 text-sm font-medium text-zinc-200 transition hover:border-cyan-200/35 hover:bg-cyan-200/[0.07] hover:text-white"><Sparkles className="size-4 text-cyan-200" />浏览作品</a>
          </div>
          <p className="mt-7 text-xs text-zinc-500">创造属于你的像素世界</p>
        </div>
        <div className="relative mx-auto w-full max-w-[480px]">
          <div className="absolute -inset-5 -z-10 bg-[radial-gradient(circle,rgba(82,83,245,.32),transparent_65%)] blur-2xl" />
          <div className="pixel-corners relative overflow-hidden border border-cyan-200/20 bg-[#111329]/75 p-3 shadow-2xl shadow-violet-950/50 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/[0.1] px-2 pb-3 text-xs text-zinc-400"><span className="flex items-center gap-2"><span className="size-2 bg-cyan-300" />LIVE CANVAS</span><span className="text-cyan-200">12,846 pixels</span></div>
            <div className="mt-3 grid aspect-square grid-cols-4 gap-1.5 bg-[#0d0d1d] p-3 sm:gap-2 sm:p-5">
              {pixels.map((color, index) => <span key={`${color}-${index}`} className="pixel-tile" style={{ backgroundColor: color, animationDelay: `${index * 90}ms` }} />)}
            </div>
            <div className="mt-3 flex items-center justify-between px-2 pb-1 text-xs"><span className="text-zinc-500">Creative space / 01</span><span className="font-medium text-violet-200">PixelVerse</span></div>
          </div>
          <div className="absolute -bottom-5 -left-5 hidden border border-violet-300/20 bg-[#151630]/90 px-4 py-3 text-xs shadow-xl shadow-black/30 backdrop-blur sm:block"><span className="block text-zinc-500">正在创作</span><span className="mt-1 block font-medium text-white">NeoCity_2049</span></div>
        </div>
      </div>
    </section>
  );
}
