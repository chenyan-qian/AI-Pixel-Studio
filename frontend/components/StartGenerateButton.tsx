import { Grid2X2, LoaderCircle } from "lucide-react";

interface StartGenerateButtonProps {
  disabled: boolean;
  isProcessing?: boolean;
  onClick: () => void;
}

/** Starts grid analysis for the selected source image. */
export default function StartGenerateButton({ disabled, isProcessing = false, onClick }: StartGenerateButtonProps) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="inline-flex h-11 w-full items-center justify-center gap-2 bg-violet-500 px-5 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 sm:w-auto">
      {isProcessing ? <LoaderCircle className="size-4 animate-spin" /> : <Grid2X2 className="size-4" />}
      {isProcessing ? "正在生成网格..." : "生成像素网格"}
    </button>
  );
}
