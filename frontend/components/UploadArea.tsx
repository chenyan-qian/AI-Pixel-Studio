"use client";

import { ImageUp, LoaderCircle } from "lucide-react";
import { ChangeEvent, DragEvent, useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface UploadAreaProps {
  isUploading: boolean;
  onFileSelected: (file: File) => void;
}

/** Drag-and-drop image picker that validates the supported source formats. */
export default function UploadArea({ isUploading, onFileSelected }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function selectFile(file?: File) {
    if (file && ACCEPTED_TYPES.includes(file.type)) onFileSelected(file);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  return (
    <button
      type="button"
      disabled={isUploading}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`mt-5 flex min-h-52 w-full flex-col items-center justify-center border border-dashed px-5 text-center transition ${isDragging ? "border-violet-300 bg-violet-400/10" : "border-white/[0.18] bg-black/10 hover:border-violet-400 hover:bg-violet-400/[0.05]"} disabled:cursor-wait disabled:opacity-70`}
    >
      {isUploading ? <LoaderCircle className="size-8 animate-spin text-violet-300" /> : <ImageUp className="size-8 text-violet-300" />}
      <span className="mt-4 text-sm font-medium text-zinc-100">{isUploading ? "图片上传中..." : "点击上传图片"}</span>
      <span className="mt-1 text-sm text-zinc-500">或拖拽图片到这里</span>
      <input ref={inputRef} className="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleInputChange} />
    </button>
  );
}
