import { TRANSPARENT, type PixelMatrix } from "@/lib/pixel-editor-store";

/** 根据矩阵创建原始像素尺寸的图片，不对像素进行平滑缩放。 */
export function exportPixelMatrix(pixels: PixelMatrix, size: number, mimeType: "image/png" | "image/jpeg") {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法创建导出画布。");
  if (mimeType === "image/jpeg") {
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, size, size);
  }
  pixels.forEach((row, y) => row.forEach((color, x) => {
    if (color === TRANSPARENT) return;
    context.fillStyle = color;
    context.fillRect(x, y, 1, 1);
  }));
  return canvas.toDataURL(mimeType, 1);
}

/** 触发浏览器下载由 Canvas 生成的图片。 */
export function downloadImage(dataUrl: string, extension: "png" | "jpg") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `pixel-art-${Date.now()}.${extension}`;
  link.click();
}
