import { TRANSPARENT, type PixelMatrix, type SoftnessMatrix } from "@/lib/pixel-editor-store";

export interface PixelExportOptions {
  pixels: PixelMatrix;
  initialPixels: PixelMatrix;
  pixelSoftness: SoftnessMatrix;
  gridWidth: number;
  gridHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  sourceImageUrl: string | null;
  sourceWidth: number;
  sourceHeight: number;
  mimeType: "image/png" | "image/jpeg";
}

function loadSourceImage(sourceImageUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    // 上传图片来自后端静态资源服务，必须以 CORS 模式加载后才能写入导出画布。
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("原始图片加载失败，无法导出。"));
    image.src = sourceImageUrl;
  });
}

/**
 * 按编辑器画布的合成顺序生成图片：原图在底层，已修改的格子覆盖在上层。
 * 网格线和缩放仅用于编辑，不会写入导出文件。
 */
export async function exportPixelImage({
  pixels,
  initialPixels,
  pixelSoftness,
  gridWidth,
  gridHeight,
  canvasWidth,
  canvasHeight,
  sourceImageUrl,
  sourceWidth,
  sourceHeight,
  mimeType,
}: PixelExportOptions) {
  const sourceImage = sourceImageUrl ? await loadSourceImage(sourceImageUrl) : null;
  const width = canvasWidth || gridWidth;
  const height = canvasHeight || gridHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法创建导出画布。");

  if (mimeType === "image/jpeg") {
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, width, height);
  }
  if (sourceImage) context.drawImage(sourceImage, 0, 0, sourceWidth || sourceImage.naturalWidth, sourceHeight || sourceImage.naturalHeight);

  const cellWidth = width / gridWidth;
  const cellHeight = height / gridHeight;
  pixels.forEach((row, y) => row.forEach((color, x) => {
    // 未修改的初始格子继续显示原图，和编辑器预览保持一致。
    if (sourceImage && color === initialPixels[y]?.[x]) return;

    const left = x * cellWidth;
    const top = y * cellHeight;
    const softness = pixelSoftness[y]?.[x] || 0;
    const blurRadius = Math.min(cellWidth, cellHeight) * softness / 260;

    // 柔化滤镜会降低边缘不透明度，先写入底色，避免底图从边缘透出。
    if (blurRadius > 0) {
      if (color === TRANSPARENT) context.clearRect(left, top, cellWidth, cellHeight);
      else {
        context.fillStyle = color;
        context.fillRect(left, top, cellWidth, cellHeight);
      }
    }

    context.save();
    if (blurRadius > 0) context.filter = `blur(${blurRadius}px)`;
    if (color === TRANSPARENT) {
      if (blurRadius === 0) {
        context.clearRect(left, top, cellWidth, cellHeight);
        context.restore();
        return;
      }
      context.globalCompositeOperation = "destination-out";
      context.fillStyle = "#000000";
    } else context.fillStyle = color;
    context.fillRect(left, top, cellWidth, cellHeight);
    context.restore();
  }));

  return canvas.toDataURL(mimeType, 1);
}

/** 触发浏览器下载由画布生成的图片。 */
export function downloadImage(dataUrl: string, extension: "png" | "jpg") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `pixel-art-${Date.now()}.${extension}`;
  link.click();
}
