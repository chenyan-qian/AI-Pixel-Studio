const PIXEL_SIZES = [4, 8, 16, 32, 64];

interface PixelSizeSelectorProps {
  imageWidth: number;
  imageHeight: number;
  value: number;
  onChange: (pixelSize: number) => void;
}

export default function PixelSizeSelector({ imageWidth, imageHeight, value, onChange }: PixelSizeSelectorProps) {
  return <fieldset><legend className="text-base font-semibold text-white">选择像素格大小</legend><p className="mt-1 text-sm text-zinc-500">画布会自动扩展到完整网格，所有像素格始终为正方形。</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{PIXEL_SIZES.map((size) => { const canvasWidth = Math.ceil(imageWidth / size) * size; const canvasHeight = Math.ceil(imageHeight / size) * size; const gridWidth = canvasWidth / size; const gridHeight = canvasHeight / size; return <label key={size} className={`pixel-corners cursor-pointer border p-3 text-sm transition ${value === size ? "border-cyan-300 bg-cyan-300/10 text-cyan-100" : "border-white/[0.12] bg-black/10 text-zinc-400 hover:border-violet-300/60"}`}><span className="flex items-center gap-2"><input className="accent-cyan-400" type="radio" name="pixel-size" value={size} checked={value === size} onChange={() => onChange(size)} /><b>{size}px</b></span><span className="mt-2 block text-xs text-zinc-500">{gridWidth} × {gridHeight} 格</span>{(canvasWidth !== imageWidth || canvasHeight !== imageHeight) && <span className="mt-1 block text-[11px] text-zinc-600">画布 {canvasWidth} × {canvasHeight}</span>}</label>; })}</div></fieldset>;
}
