import { Download, PencilRuler, Sparkles } from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI 智能生成像素画", description: "上传任意图片，快速生成高质量像素风作品。", accent: "text-violet-300", border: "group-hover:border-violet-400/35" },
  { icon: PencilRuler, title: "在线像素编辑器", description: "支持铅笔、橡皮、颜色选择、图层管理等编辑功能。", accent: "text-sky-300", border: "group-hover:border-sky-400/35" },
  { icon: Download, title: "多格式导出", description: "支持导出 PNG、GIF、Sprite Sheet 等多种格式，方便游戏开发使用。", accent: "text-fuchsia-300", border: "group-hover:border-fuchsia-400/35" },
];

export function Features() {
  return (
    <section className="border-y border-white/[0.07] bg-[#0b0c12] px-5 py-24 sm:px-8 lg:py-32" id="作品展示" aria-labelledby="features-title">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-violet-300">为创作而生</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[0.01em] text-white sm:text-3xl" id="features-title">简单的工具，丰富的表达</h2>
          <p className="mt-4 text-sm leading-6 text-zinc-500">从图像生成到逐像素微调，把想法转化为可用的游戏与创作资产。</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description, accent, border }) => (
            <article className={`group border border-white/[0.09] bg-[#10121a] p-6 shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:bg-[#141622] ${border}`} key={title}>
              <div className={`grid size-10 place-items-center border border-current/20 bg-white/[0.03] ${accent}`}><Icon className="size-5" /></div>
              <h3 className="mt-6 text-base font-medium text-zinc-100">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-500">{description}</p>
              <div className={`mt-6 h-px w-8 bg-current opacity-50 transition-all duration-300 group-hover:w-14 ${accent}`} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
