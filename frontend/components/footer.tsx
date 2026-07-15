import { Github, Mail, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="px-5 py-10 sm:px-8" id="about">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 border-t border-white/[0.08] pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300"><Sparkles className="size-4 text-violet-300" /> AI Pixel Studio</div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-zinc-500">
          <a className="inline-flex items-center gap-1.5 transition hover:text-zinc-200" href="#"><Github className="size-4" /> GitHub</a>
          <a className="inline-flex items-center gap-1.5 transition hover:text-zinc-200" href="#"><Mail className="size-4" /> 联系我们</a>
          <a className="transition hover:text-zinc-200" href="#">隐私政策</a>
        </div>
        <p className="text-xs text-zinc-600">© 2026 AI Pixel Studio</p>
      </div>
    </footer>
  );
}
