import { Github, Mail, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="px-5 py-16 sm:px-8" id="community"><div className="pixel-corners mx-auto max-w-6xl border border-cyan-200/15 bg-[#15162b]/70 px-6 py-10 text-center shadow-2xl shadow-violet-950/20 sm:px-12"><Sparkles className="mx-auto size-5 text-cyan-200" /><p className="mt-5 text-sm font-semibold tracking-[0.18em] text-violet-300">PIXELVERSE</p><h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Every Pixel Has A Story</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-zinc-400">每一个像素都是创作的一部分，PixelVerse 让用户通过像素创造属于自己的世界。</p><div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-zinc-500"><a className="inline-flex items-center gap-1.5 transition hover:text-cyan-100" href="#"><Github className="size-4" /> GitHub</a><a className="inline-flex items-center gap-1.5 transition hover:text-cyan-100" href="#"><Mail className="size-4" /> 联系我们</a><a className="transition hover:text-cyan-100" href="#">隐私政策</a></div><p className="mt-8 text-xs text-zinc-600">© 2026 PixelVerse · Create Your Pixel World</p></div></footer>
  );
}
