import { FileImage, Maximize2 } from "lucide-react";

export interface UploadedImage {
  name: string;
  size: number;
  width: number;
  height: number;
  previewUrl: string;
  uploadedUrl: string;
}

interface ImagePreviewProps {
  image: UploadedImage;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Displays the selected source image and server-confirmed metadata. */
export default function ImagePreview({ image }: ImagePreviewProps) {
  return (
    <section aria-labelledby="preview-title">
      <h2 id="preview-title" className="text-base font-semibold text-white">图片预览</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex min-h-52 items-center justify-center overflow-hidden border border-white/[0.12] bg-black/20">
          <img className="max-h-80 w-auto max-w-full object-contain" src={image.previewUrl || image.uploadedUrl} alt={`已上传图片：${image.name}`} />
        </div>
        <dl className="space-y-4 border border-white/[0.1] bg-black/10 p-4 text-sm">
          <div className="flex gap-3"><FileImage className="mt-0.5 size-4 shrink-0 text-violet-300" /><div><dt className="text-zinc-500">文件</dt><dd className="mt-1 break-all text-zinc-200">{image.name}</dd></div></div>
          <div><dt className="text-zinc-500">大小</dt><dd className="mt-1 text-zinc-200">{formatFileSize(image.size)}</dd></div>
          <div className="flex gap-3"><Maximize2 className="mt-0.5 size-4 shrink-0 text-violet-300" /><div><dt className="text-zinc-500">分辨率</dt><dd className="mt-1 text-zinc-200">{image.width} × {image.height}</dd></div></div>
        </dl>
      </div>
    </section>
  );
}
