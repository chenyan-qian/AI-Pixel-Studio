import { Heart, Sparkles } from "lucide-react";

const palettes = [
  ["#191d4a", "#3844a3", "#77c8ff", "#f4d06f", "#f38ba8", "#6b5ce7", "#1f285b", "#55e1c4", "#dbf4ff", "#ed8ccb", "#394eb7", "#121530", "#49a7d8", "#f5ad65", "#5140b6", "#24316c"],
  ["#121b38", "#284a8d", "#5be7c4", "#a7f3d0", "#d7fffb", "#2c2c79", "#7d55d3", "#f0a9e2", "#1a2b5b", "#2d75b8", "#6de4ff", "#c1b8ff", "#4a3388", "#f5ce76", "#69d5aa", "#192349"],
  ["#21194a", "#684bc4", "#b486f7", "#f7b1d1", "#fdde90", "#6bdbdd", "#1b315e", "#3c69b7", "#ed87b0", "#ffc76b", "#6b5ad3", "#312263", "#90f2e4", "#c8d4ff", "#5741a0", "#1a1738"],
  ["#132241", "#285993", "#4aa9c5", "#91dfd0", "#f7d878", "#f28c8c", "#4f428f", "#272558", "#1e4076", "#4989b9", "#75ddd5", "#b5f5e7", "#efd16a", "#a765c7", "#5347aa", "#14213d"],
];

const works = [
  { title: "Moonlit Signal", author: "Mira", likes: "2.4k", palette: palettes[0], label: "热门像素作品" },
  { title: "Tide Pool", author: "Kiro", likes: "1.8k", palette: palettes[1], label: "热门像素作品" },
  { title: "Sunset Terminal", author: "Aster", likes: "826", palette: palettes[2], label: "最新创作" },
  { title: "Little Voyager", author: "Yun", likes: "594", palette: palettes[3], label: "最新创作" },
];

function PixelArtwork({ palette, title }: { palette: string[]; title: string }) {
  return <div className="grid aspect-[5/4] grid-cols-4 gap-1 bg-[#0d1020] p-2" aria-label={`${title} 像素作品`}>{palette.map((color, index) => <span key={`${color}-${index}`} className="block min-h-0" style={{ backgroundColor: color }} />)}</div>;
}

export function ImageShowcase() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:py-28" id="works" aria-labelledby="showcase-title">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold tracking-[0.18em] text-violet-300">COMMUNITY GALLERY</p><h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl" id="showcase-title">来自 PixelVerse 的灵感</h2></div><a className="inline-flex items-center gap-2 text-sm text-cyan-200 transition hover:text-white" href="#community">探索创作社区 <Sparkles className="size-4" /></a></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{works.map((work) => <article className="pixel-corners overflow-hidden border border-white/[0.1] bg-[#16172b] shadow-xl shadow-black/15 transition hover:-translate-y-1 hover:border-violet-300/35" key={work.title}><PixelArtwork palette={work.palette} title={work.title} /><div className="p-4"><span className="text-[11px] text-cyan-200/75">{work.label}</span><h3 className="mt-1 text-sm font-semibold text-white">{work.title}</h3><div className="mt-3 flex items-center justify-between text-xs"><span className="text-zinc-500">by <span className="text-zinc-300">{work.author}</span></span><span className="inline-flex items-center gap-1 text-pink-200"><Heart className="size-3 fill-current" />{work.likes}</span></div></div></article>)}</div>
      </div>
    </section>
  );
}
