"use client";

import { ImageUp, LoaderCircle, Sparkles } from "lucide-react";
import { ChangeEvent, DragEvent, useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
interface UploadAreaProps { isUploading: boolean; onFileSelected: (file: File) => void; }

export default function UploadArea({ isUploading, onFileSelected }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  function selectFile(file?: File) { if (file && ACCEPTED_TYPES.includes(file.type)) onFileSelected(file); }
  function handleInputChange(event: ChangeEvent<HTMLInputElement>) { selectFile(event.target.files?.[0]); event.target.value = ""; }
  function handleDrop(event: DragEvent<HTMLButtonElement>) { event.preventDefault(); setIsDragging(false); selectFile(event.dataTransfer.files[0]); }
  return <button type="button" disabled={isUploading} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`pixel-corners mt-6 flex min-h-64 w-full flex-col items-center justify-center border border-dashed px-5 text-center transition ${isDragging ? "border-cyan-200 bg-cyan-300/10" : "border-violet-300/35 bg-[#0b0d1d]/60 hover:border-cyan-300/70 hover:bg-cyan-300/[0.06]"} disabled:cursor-wait disabled:opacity-70`}><span className="grid size-14 place-items-center border border-cyan-200/25 bg-cyan-200/[0.07] text-cyan-200">{isUploading ? <LoaderCircle className="size-6 animate-spin" /> : <ImageUp className="size-6" />}</span><span className="mt-5 text-base font-semibold text-zinc-100">{isUploading ? "正在带入你的画布..." : "拖入你的图片"}</span><span className="mt-2 inline-flex items-center gap-1.5 text-sm text-zinc-500"><Sparkles className="size-3.5 text-violet-300" />开始创造像素世界</span><span className="mt-5 rounded-md border border-white/[0.1] px-3 py-1.5 text-xs text-zinc-400">JPG · PNG · WEBP</span><input ref={inputRef} className="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleInputChange} /></button>;
}
