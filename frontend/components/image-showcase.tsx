import { ArrowRight, Check, WandSparkles } from "lucide-react";

function OriginalArtwork() {
  return (
    <div className="relative h-full overflow-hidden bg-[#7db0c5]" aria-label="原始风景图片示例">
      <div className="absolute inset-x-0 top-0 h-3/5 bg-[linear-gradient(180deg,#9ec7d1_0%,#d8d3c2_100%)]" />
      <div className="absolute left-[13%] top-[16%] size-[18%] rounded-full bg-[#f4d7a4] opacity-90" />
      <div className="absolute inset-x-0 bottom-[26%] h-[38%] bg-[#678e86] [clip-path:polygon(0_70%,18%_34%,31%_67%,51%_12%,69%_66%,82%_35%,100%_72%,100%_100%,0_100%)]" />
      <div className="absolute inset-x-0 bottom-[15%] h-[35%] bg-[#355f67] [clip-path:polygon(0_70%,14%_37%,29%_71%,48%_20%,61%_62%,75%_35%,100%_73%,100%_100%,0_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[31%] bg-[linear-gradient(160deg,#254d56_0%,#1e344b_72%)]" />
      <div className="absolute bottom-[13%] left-[25%] h-[33%] w-[2px] rotate-[-25deg] bg-[#172b3c]" />
      <div className="absolute bottom-[22%] left-[20%] h-[2px] w-[14%] rotate-[-28deg] bg-[#172b3c]" />
      <div className="absolute bottom-[22%] left-[29%] h-[2px] w-[14%] rotate-[24deg] bg-[#172b3c]" />
      <div className="absolute bottom-[13%] right-[23%] h-[40%] w-[2px] rotate-[24deg] bg-[#172b3c]" />
      <div className="absolute bottom-[25%] right-[18%] h-[2px] w-[15%] rotate-[28deg] bg-[#172b3c]" />
      <div className="absolute bottom-[25%] right-[27%] h-[2px] w-[15%] rotate-[-23deg] bg-[#172b3c]" />
    </div>
  );
}

function PixelArt() {
  const rows = [
    ["#1a1732", "#1a1732", "#363265", "#363265", "#7568ad", "#1a1732", "#1a1732", "#252143"],
    ["#1a1732", "#4d4784", "#7467af", "#a48ddd", "#bfb1ef", "#7467af", "#403979", "#252143"],
    ["#4b447d", "#8d77c9", "#c8b4ef", "#e8d9f8", "#eddff9", "#bfafe8", "#715cb3", "#39336a"],
    ["#695baa", "#ad91d7", "#d9c1ef", "#ffe4d2", "#ffe0b9", "#d8c1ef", "#9a7ecc", "#5c4c9d"],
    ["#3f3977", "#7e6abe", "#d2bbe8", "#fbd9c6", "#f9d2a8", "#c4b1e2", "#7d66b5", "#39346c"],
    ["#1b3460", "#345690", "#5d86bb", "#82a6d2", "#90b5d5", "#5e80b1", "#3c5b92", "#202e55"],
    ["#173458", "#275a86", "#3e7b9b", "#65a0af", "#5d9da7", "#39768d", "#285678", "#1a3155"],
    ["#11294a", "#194665", "#28647a", "#418584", "#498b7e", "#2e6474", "#1d4765", "#152b4c"],
  ];

  return (
    <div className="grid h-full w-full grid-cols-8 overflow-hidden bg-[#16213e]" aria-label="AI 生成的像素画示例">
      {rows.flat().map((color, index) => <span className="aspect-square" key={`${color}-${index}`} style={{ backgroundColor: color }} />)}
    </div>
  );
}

function PreviewCard({ pixel }: { pixel?: boolean }) {
  return (
    <div className="overflow-hidden border border-white/[0.1] bg-[#11131b] shadow-2xl shadow-black/25">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <span className={`size-2 ${pixel ? "bg-violet-400" : "bg-cyan-400"}`} />
          {pixel ? "AI 生成的像素画" : "原始图片"}
        </div>
        {pixel ? <WandSparkles className="size-4 text-violet-300" /> : <span className="text-xs text-zinc-600">JPG</span>}
      </div>
      <div className="relative aspect-[4/3] overflow-hidden bg-[#171b25] p-3">
        {pixel ? <PixelArt /> : <OriginalArtwork />}
      </div>
      <div className="flex items-center gap-2 px-4 py-3 text-xs text-zinc-500">
        <Check className="size-3.5 text-emerald-400" /> {pixel ? "16 色调色板 · 32 × 32" : "上传图片 · 1920 × 1280"}
      </div>
    </div>
  );
}

export function ImageShowcase() {
  return (
    <section className="px-5 pb-24 sm:px-8 lg:pb-32" aria-labelledby="showcase-title">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-violet-300">从灵感到像素</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[0.01em] text-white sm:text-3xl" id="showcase-title">一键转换，保留每处细节</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-zinc-500">智能识别构图与光影，让照片转化为兼具风格与辨识度的像素作品。</p>
        </div>
        <div className="grid items-center gap-4 lg:grid-cols-[1fr_72px_1fr] lg:gap-6">
          <PreviewCard />
          <div className="relative mx-auto grid size-10 place-items-center border border-violet-300/25 bg-violet-400/[0.08] text-violet-200 lg:size-12">
            <ArrowRight className="size-5 lg:size-6" />
          </div>
          <PreviewCard pixel />
        </div>
      </div>
    </section>
  );
}
