"use client";

import { Minus, Plus } from "lucide-react";
import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { fillMatrix, paintMatrixPixel, paintMatrixSoftness, TRANSPARENT, type PixelMatrix, type SoftnessMatrix, usePixelEditorStore } from "@/lib/pixel-editor-store";

const MIN_ZOOM = 5;
const MAX_ZOOM = 24;
const MAX_RENDER_SIZE = 4096;

/** 根据像素矩阵重绘 Canvas，并将指针操作映射为矩阵坐标。 */
export default function CanvasBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const panningRef = useRef(false);
  const spacePressedRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const draftRef = useRef<PixelMatrix | null>(null);
  const draftSoftnessRef = useRef<SoftnessMatrix | null>(null);
  const changedRef = useRef(false);
  const changedCellsRef = useRef<Array<{ x: number; y: number }>>([]);
  const lastCellRef = useRef("");
  const [zoom, setZoom] = useState(12);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draftPixels, setDraftPixels] = useState<PixelMatrix | null>(null);
  const [draftSoftness, setDraftSoftness] = useState<SoftnessMatrix | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const gridWidth = usePixelEditorStore((state) => state.gridWidth);
  const gridHeight = usePixelEditorStore((state) => state.gridHeight);
  const pixelSize = usePixelEditorStore((state) => state.pixelSize);
  const canvasWidth = usePixelEditorStore((state) => state.canvasWidth);
  const canvasHeight = usePixelEditorStore((state) => state.canvasHeight);
  const pixels = usePixelEditorStore((state) => state.pixels);
  const pixelSoftness = usePixelEditorStore((state) => state.pixelSoftness);
  const initialPixels = usePixelEditorStore((state) => state.initialPixels);
  const sourceImageUrl = usePixelEditorStore((state) => state.sourceImageUrl);
  const sourceWidth = usePixelEditorStore((state) => state.sourceWidth);
  const sourceHeight = usePixelEditorStore((state) => state.sourceHeight);
  const tool = usePixelEditorStore((state) => state.tool);
  const selectedColor = usePixelEditorStore((state) => state.selectedColor);
  const edgeSoftness = usePixelEditorStore((state) => state.edgeSoftness);
  const commitPixels = usePixelEditorStore((state) => state.commitPixels);
  const setSelectedColor = usePixelEditorStore((state) => state.setSelectedColor);
  const setHoveredPixel = usePixelEditorStore((state) => state.setHoveredPixel);
  const displayPixels = draftPixels || pixels;
  const displaySoftness = draftSoftness || pixelSoftness;
  const imageRatio = canvasWidth > 0 && canvasHeight > 0 ? canvasHeight / canvasWidth : gridHeight / gridWidth || 1;
  const displayWidth = gridWidth * zoom;
  const displayHeight = gridHeight * zoom;
  const { renderWidth, renderHeight } = useMemo(() => {
    const targetWidth = Math.max(gridWidth * zoom, canvasWidth || 0);
    const scale = Math.min(1, MAX_RENDER_SIZE / targetWidth, MAX_RENDER_SIZE / (targetWidth * imageRatio));
    const width = Math.max(gridWidth, Math.floor(targetWidth * scale));
    return { renderWidth: width, renderHeight: Math.max(gridHeight, Math.round(width * imageRatio)) };
  }, [canvasWidth, gridHeight, gridWidth, imageRatio, zoom]);

  useEffect(() => {
    if (!sourceImageUrl) { setSourceImage(null); return; }
    const image = new window.Image();
    image.onload = () => setSourceImage(image);
    image.onerror = () => setSourceImage(null);
    image.src = sourceImageUrl;
    return () => { image.onload = null; image.onerror = null; };
  }, [sourceImageUrl]);

  useEffect(() => {
    // 切换新的作品或网格规格后，画布回到初始视图位置。
    setPan({ x: 0, y: 0 });
  }, [gridHeight, gridWidth, sourceImageUrl]);

  useEffect(() => {
    // 空格加左键是常见图像编辑器的平移手势，不会占用浏览器右键菜单。
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || event.target instanceof HTMLInputElement) return;
      event.preventDefault();
      spacePressedRef.current = true;
    }
    function handleKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") spacePressedRef.current = false;
    }
    function handleWindowBlur() { spacePressedRef.current = false; }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // 原生非被动监听才能可靠阻止浏览器页面和外层容器响应滚轮。
    function handleNativeWheel(event: WheelEvent) {
      event.preventDefault();
      event.stopPropagation();
      setZoom((value) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value + (event.deltaY < 0 ? 1 : -1))));
    }
    // 右键专用于画布平移，因此在 Canvas 范围内禁止浏览器上下文菜单。
    function preventContextMenu(event: MouseEvent) {
      event.preventDefault();
      event.stopPropagation();
    }
    canvas.addEventListener("wheel", handleNativeWheel, { passive: false });
    canvas.addEventListener("contextmenu", preventContextMenu);
    return () => {
      canvas.removeEventListener("wheel", handleNativeWheel);
      canvas.removeEventListener("contextmenu", preventContextMenu);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gridWidth === 0 || gridHeight === 0) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const cellWidth = renderWidth / gridWidth;
    const cellHeight = renderHeight / gridHeight;
    context.clearRect(0, 0, renderWidth, renderHeight);

    // 初始状态保持原图清晰；不再使用中心采样色填满整张画布。
    if (sourceImage) {
      context.imageSmoothingEnabled = true;
      const sourceDrawWidth = renderWidth * sourceWidth / (canvasWidth || sourceWidth);
      const sourceDrawHeight = renderHeight * sourceHeight / (canvasHeight || sourceHeight);
      context.drawImage(sourceImage, 0, 0, sourceDrawWidth, sourceDrawHeight);
    }

    const editedCells: Array<{ x: number; y: number; color: string; softness: number }> = [];
    displayPixels.forEach((row, y) => row.forEach((color, x) => {
      const initialColor = initialPixels[y]?.[x];
      // 与初始矩阵相同的单元继续透出原图，只有实际编辑才覆盖。
      if (sourceImage && color === initialColor) return;
      editedCells.push({ x, y, color, softness: displaySoftness[y]?.[x] || 0 });
    }));

    editedCells.forEach(({ x, y, color, softness }) => {
      const left = x * cellWidth;
      const top = y * cellHeight;
      const blurRadius = Math.min(cellWidth, cellHeight) * softness / 260;
      if (blurRadius > 0) {
        // 模糊后的填充会带一点透明度，先铺一层不透明底色，避免露出原图。
        context.save();
        if (color === TRANSPARENT) context.clearRect(left, top, cellWidth, cellHeight);
        else {
          context.fillStyle = color;
          context.fillRect(left, top, cellWidth, cellHeight);
        }
        context.restore();
      }
      // 每个单元读取其创建时保存的柔化值，后续滑杆调整不会影响已有修改。
      context.save();
      if (blurRadius > 0) context.filter = `blur(${blurRadius}px)`;
      if (color === TRANSPARENT) {
        if (blurRadius > 0) {
          context.globalCompositeOperation = "destination-out";
          context.fillStyle = "#000000";
        } else {
          context.clearRect(left, top, cellWidth, cellHeight);
          context.restore();
          return;
        }
      } else context.fillStyle = color;
      context.fillRect(left, top, cellWidth, cellHeight);
      context.restore();
    });

    // 网格线绘制在最上层，放大后仍能区分每个独立可编辑单元。
    context.beginPath();
    for (let line = 0; line <= gridWidth; line++) {
      const x = line * cellWidth;
      context.moveTo(x, 0);
      context.lineTo(x, renderHeight);
    }
    for (let line = 0; line <= gridHeight; line++) {
      const y = line * cellHeight;
      context.moveTo(0, y);
      context.lineTo(renderWidth, y);
    }
    context.strokeStyle = "rgba(15, 23, 42, 0.18)";
    context.lineWidth = Math.max(0.75, Math.min(cellWidth, cellHeight) * 0.035);
    context.stroke();
  }, [canvasHeight, canvasWidth, displayPixels, displaySoftness, gridHeight, gridWidth, initialPixels, renderHeight, renderWidth, sourceHeight, sourceImage, sourceWidth]);

  function getCell(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(gridWidth - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * gridWidth))),
      y: Math.min(gridHeight - 1, Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * gridHeight))),
    };
  }

  function drawAt(x: number, y: number) {
    const color = tool === "eraser" ? TRANSPARENT : selectedColor;
    const current = draftRef.current || pixels;
    const currentSoftness = draftSoftnessRef.current || pixelSoftness;
    const next = paintMatrixPixel(current, x, y, color);
    const nextSoftness = paintMatrixSoftness(currentSoftness, x, y, edgeSoftness);
    if (next !== current || nextSoftness !== currentSoftness) {
      changedRef.current = true;
      changedCellsRef.current.push({ x, y });
      draftRef.current = next;
      draftSoftnessRef.current = nextSoftness;
      setDraftPixels(next);
      setDraftSoftness(nextSoftness);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const isPanGesture = event.button === 2 || event.button === 1 || (event.button === 0 && spacePressedRef.current);
    if (isPanGesture) {
      // 鼠标右键、中键或空格加左键只控制画布视图，不触发绘制或颜色选择。
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      panningRef.current = true;
      panStartRef.current = { x: event.clientX, y: event.clientY, offsetX: pan.x, offsetY: pan.y };
      return;
    }
    if (event.button !== 0) return;
    const { x, y } = getCell(event);
    const color = displayPixels[y]?.[x] || TRANSPARENT;
    if (tool === "eyedropper") {
      if (color !== TRANSPARENT) setSelectedColor(color);
      return;
    }
    if (tool === "fill") {
      const next = fillMatrix(pixels, x, y, selectedColor);
      if (next !== pixels) {
        const nextSoftness = pixelSoftness.map((row, rowIndex) => row.map((softness, columnIndex) => next[rowIndex][columnIndex] !== pixels[rowIndex][columnIndex] ? edgeSoftness : softness));
        commitPixels(next, nextSoftness, { action: "fill", description: `使用填充工具修改区域颜色为 ${selectedColor}` });
      }
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    changedRef.current = false;
    changedCellsRef.current = [];
    draftRef.current = pixels;
    draftSoftnessRef.current = pixelSoftness;
    lastCellRef.current = `${x}:${y}`;
    drawAt(x, y);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (panningRef.current) {
      const start = panStartRef.current;
      setPan({ x: start.offsetX + event.clientX - start.x, y: start.offsetY + event.clientY - start.y });
      return;
    }
    const { x, y } = getCell(event);
    setHoveredPixel({ x, y, color: displayPixels[y]?.[x] || TRANSPARENT });
    if (!drawingRef.current) return;
    const key = `${x}:${y}`;
    if (key === lastCellRef.current) return;
    lastCellRef.current = key;
    drawAt(x, y);
  }

  function finishStroke() {
    if (drawingRef.current && changedRef.current && draftRef.current && draftSoftnessRef.current) {
      const cells = changedCellsRef.current;
      const first = cells[0];
      const action = tool === "eraser" ? "擦除" : "修改";
      const color = tool === "eraser" ? "透明" : selectedColor;
      const description = cells.length === 1 && first
        ? `${action}坐标(${first.x},${first.y})像素颜色为${color}`
        : `${action}${cells.length}个像素颜色为${color}`;
      commitPixels(draftRef.current, draftSoftnessRef.current, { action: "pixel_change", description });
    }
    drawingRef.current = false;
    changedRef.current = false;
    changedCellsRef.current = [];
    draftRef.current = null;
    draftSoftnessRef.current = null;
    setDraftPixels(null);
    setDraftSoftness(null);
  }

  function finishPointerAction() {
    if (panningRef.current) {
      panningRef.current = false;
      setPan((current) => ({ ...current }));
      return;
    }
    finishStroke();
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#0b0c12]" aria-label="像素画布">
      <div className="flex h-12 items-center justify-between border-b border-white/[0.1] px-4">
        <span className="text-xs text-zinc-500">{gridWidth} × {gridHeight} 格 · {pixelSize}px</span>
        <div className="flex items-center gap-1"><button type="button" title="缩小" aria-label="缩小" onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - 1))} className="grid size-8 place-items-center text-zinc-300 hover:bg-white/[0.08]"><Minus className="size-4" /></button><span className="w-11 text-center text-xs tabular-nums text-zinc-400">{zoom}x</span><button type="button" title="放大" aria-label="放大" onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + 1))} className="grid size-8 place-items-center text-zinc-300 hover:bg-white/[0.08]"><Plus className="size-4" /></button></div>
      </div>
      <div className="pixel-checker flex min-h-0 flex-1 items-start justify-start overflow-auto overscroll-contain p-6">
        <canvas ref={canvasRef} width={renderWidth} height={renderHeight} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishPointerAction} onPointerCancel={finishPointerAction} onPointerLeave={() => { if (!drawingRef.current && !panningRef.current) setHoveredPixel(null); }} onAuxClick={(event) => event.preventDefault()} className={panningRef.current ? "cursor-grabbing [image-rendering:auto]" : "cursor-crosshair [image-rendering:auto]"} style={{ width: displayWidth, height: displayHeight, transform: `translate(${pan.x}px, ${pan.y}px)` }} />
      </div>
    </section>
  );
}
