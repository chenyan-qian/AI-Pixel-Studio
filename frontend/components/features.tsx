import { Grid3X3, ImageUp, PencilRuler, Share2 } from "lucide-react";

const steps = [
  { number: "01", icon: ImageUp, title: "上传图片", description: "带入一张照片或草图，开始你的像素旅程。", accent: "text-cyan-200" },
  { number: "02", icon: Grid3X3, title: "生成像素作品", description: "选择画布规格，转换为可编辑的像素网格。", accent: "text-violet-200" },
  { number: "03", icon: PencilRuler, title: "自由编辑", description: "逐格调色、绘制细节，让画面拥有你的风格。", accent: "text-blue-200" },
  { number: "04", icon: Share2, title: "分享作品", description: "将每一份灵感带到 PixelVerse 社区。", accent: "text-fuchsia-200" },
];

export function Features() {
  return (
    <section className="relative border-y border-white/[0.07] bg-[#111224]/60 px-5 py-20 sm:px-8 lg:py-28" id="create" aria-labelledby="features-title">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl"><p className="text-sm font-semibold tracking-[0.18em] text-cyan-300">CREATE FLOW</p><h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl" id="features-title">从灵感，到一个像素世界</h2><p className="mt-4 text-sm leading-7 text-zinc-400">保留熟悉的图像上传与编辑流程，用更适合创作的方式，把想法一点点搭建起来。</p></div>
        <div className="mt-11 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map(({ number, icon: Icon, title, description, accent }, index) => (
            <article className="pixel-corners group relative border border-white/[0.1] bg-[#17182d]/65 p-5 shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-[#1a1c35]" key={title}>
              <span className="absolute right-4 top-4 text-xs font-bold text-white/15">{number}</span><div className={`grid size-11 place-items-center border border-current/25 bg-white/[0.04] ${accent}`}><Icon className="size-5" /></div><h3 className="mt-7 text-base font-semibold text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-zinc-500">{description}</p>{index < steps.length - 1 && <span className="absolute -right-3 top-1/2 z-10 hidden size-6 -translate-y-1/2 place-items-center border border-cyan-200/15 bg-[#111224] text-cyan-200 xl:grid">+</span>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
