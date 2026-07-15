export type PixelSize = 32 | 64 | 128 | 256;

interface PixelSizeSelectorProps {
  value: PixelSize;
  onChange: (pixelSize: PixelSize) => void;
}

const PIXEL_SIZES: PixelSize[] = [32, 64, 128, 256];

/** Controlled radio group for selecting one target pixel-art resolution. */
export default function PixelSizeSelector({ value, onChange }: PixelSizeSelectorProps) {
  return (
    <fieldset>
      <legend className="text-base font-semibold text-white">像素规格</legend>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PIXEL_SIZES.map((size) => (
          <label key={size} className={`flex cursor-pointer items-center gap-2 border px-3 py-3 text-sm transition ${value === size ? "border-violet-400 bg-violet-400/10 text-violet-100" : "border-white/[0.12] text-zinc-400 hover:border-white/[0.25]"}`}>
            <input className="accent-violet-500" type="radio" name="pixel-size" value={size} checked={value === size} onChange={() => onChange(size)} />
            {size} × {size}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
