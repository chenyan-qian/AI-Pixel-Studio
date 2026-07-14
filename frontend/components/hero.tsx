import { ArrowRight, ImagePlus, Play } from "lucide-react";

export function Hero() {
  return (
    <section className="grid-background relative isolate flex min-h-[620px] items-center justify-center px-5 pb-20 pt-32 sm:px-8" id="首页">
      <div className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(91,77,183,0.20),transparent_62%)]" />
      <div className="max-w-3xl text-center">
        <div className="animate-rise inline-flex items-center gap-2 border border-violet-300/20 bg-violet-400/[0.08] px-3 py-1.5 text-xs font-medium text-violet-200">
          <span className="size-1.5 bg-violet-300" /> AI 驱动的像素艺术创作平台
        </div>
        <h1 className="animate-rise mt-7 text-balance text-4xl font-semibold leading-[1.14] tracking-[0.01em] text-white sm:text-5xl lg:text-6xl">
          让每一张图片，都变成精美的<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-blue-300">像素艺术</span>
        </h1>
        <p className="animate-rise animation-delay-100 mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-zinc-400 sm:text-lg">
          上传一张图片，AI 将自动为你生成高质量像素风作品，并支持在线编辑、颜色调整和多种格式导出。
        </p>
        <div className="animate-rise animation-delay-200 mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <button className="inline-flex h-12 items-center justify-center gap-2 bg-violet-500 px-6 text-sm font-medium text-white shadow-xl shadow-violet-950/50 transition hover:-translate-y-0.5 hover:bg-violet-400">
            <ImagePlus className="size-4" /> 上传图片 <ArrowRight className="size-4" />
          </button>
          <button className="inline-flex h-12 items-center justify-center gap-2 border border-white/[0.14] bg-white/[0.04] px-6 text-sm font-medium text-zinc-200 transition hover:-translate-y-0.5 hover:border-white/[0.24] hover:bg-white/[0.08] hover:text-white">
            <span className="grid size-5 place-items-center border border-zinc-500/60"><Play className="ml-0.5 size-2.5 fill-current" /></span>
            在线体验
          </button>
        </div>
        <p className="mt-7 text-xs text-zinc-600">无需安装软件，直接在浏览器中开始创作</p>
      </div>
    </section>
  );
}
