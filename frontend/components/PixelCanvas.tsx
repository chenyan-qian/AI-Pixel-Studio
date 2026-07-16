"use client";

import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";

export interface PixelCell {
  x: number;
  y: number;
  color: string;
}

interface PixelCanvasProps {
  size: number;
  pixels: PixelCell[];
  sourceImageUrl: string;
  sourceWidth: number;
  sourceHeight: number;
  onPixelColorChange: (x: number, y: number, color: string) => void;
}

const CANVAS_WIDTH = 512;

/** Draws the unmodified source image with an editable grid overlay. */
export default function PixelCanvas({ size, pixels, sourceImageUrl, sourceWidth, sourceHeight, onPixelColorChange }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [selectedCoordinate, setSelectedCoordinate] = useState<{ x: number; y: number } | null>(null);
  const [editedCoordinates, setEditedCoordinates] = useState<Set<string>>(new Set());
  const pixelsByCoordinate = useMemo(() => new Map(pixels.map((pixel) => [`${pixel.x}:${pixel.y}`, pixel])), [pixels]);
  const selectedPixel = selectedCoordinate ? pixelsByCoordinate.get(`${selectedCoordinate.x}:${selectedCoordinate.y}`) : null;
  const canvasHeight = Math.max(1, Math.round(CANVAS_WIDTH * sourceHeight / sourceWidth));

  useEffect(() => {
    const image = new window.Image();
    image.onload = () => setSourceImage(image);
    image.onerror = () => setSourceImage(null);
    image.src = sourceImageUrl;
    setSelectedCoordinate(null);
    setEditedCoordinates(new Set());
    return () => { image.onload = null; image.onerror = null; };
  }, [sourceImageUrl, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const cellWidth = CANVAS_WIDTH / size;
    const cellHeight = canvasHeight / size;
    context.clearRect(0, 0, CANVAS_WIDTH, canvasHeight);
    context.fillStyle = "#111827";
    context.fillRect(0, 0, CANVAS_WIDTH, canvasHeight);
    if (sourceImage) context.drawImage(sourceImage, 0, 0, CANVAS_WIDTH, canvasHeight);

    editedCoordinates.forEach((key) => {
      const pixel = pixelsByCoordinate.get(key);
      if (!pixel) return;
      context.fillStyle = pixel.color;
      context.fillRect(pixel.x * cellWidth, pixel.y * cellHeight, cellWidth, cellHeight);
    });

    context.beginPath();
    for (let x = 0; x <= size; x++) {
      const position = x * cellWidth;
      context.moveTo(position, 0);
      context.lineTo(position, canvasHeight);
    }
    for (let y = 0; y <= size; y++) {
      const position = y * cellHeight;
      context.moveTo(0, position);
      context.lineTo(CANVAS_WIDTH, position);
    }
    context.strokeStyle = "rgba(15, 23, 42, 0.38)";
    context.lineWidth = 1;
    context.stroke();

    if (selectedCoordinate) {
      context.strokeStyle = "#FFFFFF";
      context.lineWidth = 2;
      context.strokeRect(selectedCoordinate.x * cellWidth, selectedCoordinate.y * cellHeight, cellWidth, cellHeight);
    }
  }, [canvasHeight, editedCoordinates, pixelsByCoordinate, selectedCoordinate, size, sourceImage]);

  function selectPixel(event: MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(size - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * size)));
    const y = Math.min(size - 1, Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * size)));
    setSelectedCoordinate({ x, y });
    requestAnimationFrame(() => colorInputRef.current?.click());
  }

  function changeSelectedColor(color: string) {
    if (!selectedPixel) return;
    setEditedCoordinates((current) => new Set(current).add(`${selectedPixel.x}:${selectedPixel.y}`));
    onPixelColorChange(selectedPixel.x, selectedPixel.y, color.toUpperCase());
  }

  return (
    <section className="border-t border-white/[0.1] pt-7" aria-labelledby="pixel-canvas-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="pixel-canvas-title" className="text-lg font-semibold text-white">可编辑像素网格</h2>
          <p className="mt-1 text-sm text-zinc-500">{size} × {size}，共 {pixels.length} 个像素块</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <span>{selectedPixel ? `(${selectedPixel.x}, ${selectedPixel.y})` : "选择像素"}</span>
          <input ref={colorInputRef} type="color" disabled={!selectedPixel} value={selectedPixel?.color || "#000000"} onChange={(event) => changeSelectedColor(event.target.value)} className="size-9 cursor-pointer border border-white/[0.14] bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-50" aria-label="修改选中像素的颜色" />
        </label>
      </div>
      <div className="mt-5 overflow-auto border border-white/[0.12] bg-black/30 p-3">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={canvasHeight} onClick={selectPixel} tabIndex={0} aria-label="可编辑像素画布，点击像素块即可修改颜色" className="block w-full max-w-[512px] cursor-crosshair" />
      </div>
    </section>
  );
}
