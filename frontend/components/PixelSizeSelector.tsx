export type PixelSize = 32 | 64 | 128 | 256;
interface PixelSizeSelectorProps { value: PixelSize; onChange: (pixelSize: PixelSize) => void; }
const PIXEL_SIZES: PixelSize[] = [32, 64, 128, 256];

export default function PixelSizeSelector({ value, onChange }: PixelSizeSelectorProps) {
  return <fieldset><legend className="text-base font-semibold text-white">选择像素分割大小</legend><p className="mt-1 text-sm text-zinc-500">规格越小，画面越具有鲜明的像素风格。</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{PIXEL_SIZES.map((size) => <label key={size} className={`pixel-corners flex cursor-pointer items-center gap-2 border px-3 py-3 text-sm transition ${value === size ? "border-cyan-300 bg-cyan-300/10 text-cyan-100" : "border-white/[0.12] bg-black/10 text-zinc-400 hover:border-violet-300/60"}`}><input className="accent-cyan-400" type="radio" name="pixel-size" value={size} checked={value === size} onChange={() => onChange(size)} />{size} × {size}</label>)}</div></fieldset>;
}
