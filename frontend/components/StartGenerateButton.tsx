import { WandSparkles } from "lucide-react";

interface StartGenerateButtonProps {
  disabled: boolean;
  onClick: () => void;
}

/** Action control for the forthcoming AI pixel-generation workflow. */
export default function StartGenerateButton({ disabled, onClick }: StartGenerateButtonProps) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="inline-flex h-11 w-full items-center justify-center gap-2 bg-violet-500 px-5 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 sm:w-auto">
      <WandSparkles className="size-4" />开始像素化
    </button>
  );
}
