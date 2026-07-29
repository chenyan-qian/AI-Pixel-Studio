"use client";

import { Maximize, Minus, Plus } from "lucide-react";
import { PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPixelBlockCoordinates, TRANSPARENT, type PixelMatrix, type PixelOverrideMatrix, type SoftnessMatrix, usePixelEditorStore } from "@/lib/pixel-editor-store";
import { useTheme } from "@/context/ThemeContext";
import { emitLocalPixelChanges } from "@/lib/collaboration";

const ZOOM_LEVELS = Array.from({ length: 32 }, (_, index) => (index + 1) * 25);
const MIN_ZOOM = 1;
const MAX_ZOOM = 800;
const MAX_RENDER_SIZE = 4096;
const MAX_GRID_LINES = 4000;
type GridPoint = { x: number; y: number };
type ChangedCell = GridPoint;

/** 返回相邻输入点之间经过的离散像素格，避免快速移动时留下断点。 */
function getPixelLine(from: GridPoint, to: GridPoint) {
  const points: GridPoint[] = [];
  let x = from.x;
  let y = from.y;
  const deltaX = Math.abs(to.x - from.x);
  const deltaY = Math.abs(to.y - from.y);
  const stepX = from.x < to.x ? 1 : -1;
  const stepY = from.y < to.y ? 1 : -1;
  let error = deltaX - deltaY;

  while (true) {
    points.push({ x, y });
    if (x === to.x && y === to.y) return points;
    const doubledError = error * 2;
    if (doubledError > -deltaY) { error -= deltaY; x += stepX; }
    if (doubledError < deltaX) { error += deltaX; y += stepY; }
  }
}

function clampZoom(value: number) { return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value)); }

/**
 * Canvas 的位图尺寸始终映射到真实画布尺寸；zoom 只改变它的 CSS 显示尺寸。
 * 因此 pixels 矩阵、导出尺寸以及鼠标编辑坐标不会随着缩放而变化。
 */
export default function CanvasBoard() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const panningRef = useRef(false);
  const spacePressedRef = useRef(false);
  const fitModeRef = useRef(true);
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const draftRef = useRef<PixelMatrix | null>(null);
  const draftSoftnessRef = useRef<SoftnessMatrix | null>(null);
  const draftOverridesRef = useRef<PixelOverrideMatrix | null>(null);
  const changedRef = useRef(false);
  const changedCellsRef = useRef<ChangedCell[]>([]);
  const changedCellKeysRef = useRef(new Set<string>());
  const pendingDrawCellsRef = useRef<ChangedCell[]>([]);
  const lastPixelRef = useRef<GridPoint | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const draftFrameRef = useRef<number | null>(null);
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);

  const gridWidth = usePixelEditorStore((state) => state.gridWidth);
  const gridHeight = usePixelEditorStore((state) => state.gridHeight);
  const pixelSize = usePixelEditorStore((state) => state.pixelSize);
  const canvasWidth = usePixelEditorStore((state) => state.canvasWidth);
  const canvasHeight = usePixelEditorStore((state) => state.canvasHeight);
  const pixelGrid = usePixelEditorStore((state) => state.pixelGrid);
  const pixelSoftness = usePixelEditorStore((state) => state.pixelSoftness);
  const initialPixelGrid = usePixelEditorStore((state) => state.initialPixelGrid);
  const pixelOverrides = usePixelEditorStore((state) => state.pixelOverrides);
  const sourceImageUrl = usePixelEditorStore((state) => state.sourceImageUrl);
  const sourceWidth = usePixelEditorStore((state) => state.sourceWidth);
  const sourceHeight = usePixelEditorStore((state) => state.sourceHeight);
  const tool = usePixelEditorStore((state) => state.tool);
  const selectedColor = usePixelEditorStore((state) => state.selectedColor);
  const edgeSoftness = usePixelEditorStore((state) => state.edgeSoftness);
  const commitPixelGrid = usePixelEditorStore((state) => state.commitPixelGrid);
  const setSelectedColor = usePixelEditorStore((state) => state.setSelectedColor);
  const setHoveredPixel = usePixelEditorStore((state) => state.setHoveredPixel);

  // logicalSize 是作品真实尺寸；renderSize 仅为过大图像的安全预览位图尺寸。
  const logicalWidth = canvasWidth || gridWidth * pixelSize;
  const logicalHeight = canvasHeight || gridHeight * pixelSize;
  const { renderWidth, renderHeight } = useMemo(() => {
    if (!logicalWidth || !logicalHeight) return { renderWidth: 1, renderHeight: 1 };
    const scale = Math.min(1, MAX_RENDER_SIZE / logicalWidth, MAX_RENDER_SIZE / logicalHeight);
    return {
      renderWidth: Math.max(gridWidth, Math.round(logicalWidth * scale)),
      renderHeight: Math.max(gridHeight, Math.round(logicalHeight * scale)),
    };
  }, [gridHeight, gridWidth, logicalHeight, logicalWidth]);
  const displayWidth = logicalWidth * zoom / 100;
  const displayHeight = logicalHeight * zoom / 100;
  const displayCellWidth = gridWidth ? displayWidth / gridWidth : 0;
  const displayCellHeight = gridHeight ? displayHeight / gridHeight : 0;
  // 小于 8 个屏幕像素的格线会覆盖大部分像素颜色（1px 模式尤其明显），因此只在可清晰分辨时显示。
  const showGrid = zoom >= 100 && gridWidth + gridHeight <= MAX_GRID_LINES && Math.min(displayCellWidth, displayCellHeight) >= 8;

  const fitToViewport = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !logicalWidth || !logicalHeight) return;
    const horizontalPadding = 48;
    const verticalPadding = 48;
    const nextZoom = clampZoom(Math.floor(Math.min(
      (Math.max(1, viewport.clientWidth - horizontalPadding) / logicalWidth) * 100,
      (Math.max(1, viewport.clientHeight - verticalPadding) / logicalHeight) * 100,
    )));
    setZoom(nextZoom);
    setPan({ x: 0, y: 0 });
  }, [logicalHeight, logicalWidth]);

  useEffect(() => {
    if (!sourceImageUrl) { setSourceImage(null); return; }
    const image = new window.Image();
    image.onload = () => setSourceImage(image);
    image.onerror = () => setSourceImage(null);
    image.src = sourceImageUrl;
    return () => { image.onload = null; image.onerror = null; };
  }, [sourceImageUrl]);

  // 每次打开新作品或改变网格规格，都自动让整张图进入可视编辑区。
  useEffect(() => {
    fitModeRef.current = true;
    const frame = requestAnimationFrame(fitToViewport);
    return () => cancelAnimationFrame(frame);
  }, [fitToViewport, sourceImageUrl]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => { if (fitModeRef.current) fitToViewport(); });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fitToViewport]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || event.target instanceof HTMLInputElement) return;
      event.preventDefault();
      spacePressedRef.current = true;
    }
    function handleKeyUp(event: KeyboardEvent) { if (event.code === "Space") spacePressedRef.current = false; }
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

  useEffect(() => () => {
    if (draftFrameRef.current !== null) cancelAnimationFrame(draftFrameRef.current);
  }, []);

  function getCellMetrics() {
    return { cellWidth: renderWidth / gridWidth, cellHeight: renderHeight / gridHeight };
  }

  function resetCellBackground(context: CanvasRenderingContext2D, x: number, y: number) {
    const { cellWidth, cellHeight } = getCellMetrics();
    const left = x * cellWidth;
    const top = y * cellHeight;
    context.clearRect(left, top, cellWidth, cellHeight);
    if (!sourceImage) return;
    context.save();
    context.beginPath();
    context.rect(left, top, cellWidth, cellHeight);
    context.clip();
    const sourceDrawWidth = renderWidth * sourceWidth / (canvasWidth || sourceWidth);
    const sourceDrawHeight = renderHeight * sourceHeight / (canvasHeight || sourceHeight);
    context.imageSmoothingEnabled = false;
    context.drawImage(sourceImage, 0, 0, sourceDrawWidth, sourceDrawHeight);
    context.restore();
  }

  function drawCellContent(context: CanvasRenderingContext2D, x: number, y: number, color: string, softness: number) {
    const { cellWidth, cellHeight } = getCellMetrics();
    const left = x * cellWidth;
    const top = y * cellHeight;
    const blurRadius = Math.min(cellWidth, cellHeight) * softness / 260;
    context.save();
    if (blurRadius > 0) context.filter = `blur(${blurRadius}px)`;
    if (color === TRANSPARENT) {
      if (blurRadius > 0) {
        context.globalCompositeOperation = "destination-out";
        context.fillStyle = "#000000";
        context.fillRect(left, top, cellWidth, cellHeight);
      } else context.clearRect(left, top, cellWidth, cellHeight);
    } else {
      context.fillStyle = color;
      context.fillRect(left, top, cellWidth, cellHeight);
    }
    context.restore();
  }

  function redrawCells(cells: ChangedCell[], matrix: PixelMatrix, softness: SoftnessMatrix, overrides: PixelOverrideMatrix) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context || !gridWidth || !gridHeight) return;
    cells.forEach(({ x, y }) => {
      resetCellBackground(context, x, y);
      const color = matrix[y]?.[x] ?? TRANSPARENT;
      // A matching initial colour is still an explicit paint operation and must cover the source image.
      if (!sourceImage || overrides[y]?.[x]) drawCellContent(context, x, y, color, softness[y]?.[x] || 0);
    });
  }

  function drawFullCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context || !gridWidth || !gridHeight) return;
    context.clearRect(0, 0, renderWidth, renderHeight);
    if (sourceImage) {
      context.imageSmoothingEnabled = false;
      context.drawImage(sourceImage, 0, 0, renderWidth * sourceWidth / (canvasWidth || sourceWidth), renderHeight * sourceHeight / (canvasHeight || sourceHeight));
    }
    pixelGrid.forEach((row, y) => row.forEach((color, x) => {
      if (!sourceImage || pixelOverrides[y]?.[x]) drawCellContent(context, x, y, color, pixelSoftness[y]?.[x] || 0);
    }));
  }

  /** 网格为独立覆盖层：不参与图片层的合成和局部像素刷新。 */
  function drawGridCanvas() {
    const canvas = gridCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, renderWidth, renderHeight);
    if (!showGrid) return;
    const { cellWidth, cellHeight } = getCellMetrics();
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
    context.strokeStyle = theme === "dark" ? "rgba(148, 163, 184, 0.32)" : "rgba(51, 65, 85, 0.34)";
    context.lineWidth = 0.5;
    context.stroke();
  }

  useEffect(() => { drawFullCanvas(); }, [canvasHeight, canvasWidth, gridHeight, gridWidth, pixelOverrides, pixelSoftness, pixelGrid, renderHeight, renderWidth, sourceHeight, sourceImage, sourceWidth]);
  useEffect(() => { drawGridCanvas(); }, [gridHeight, gridWidth, renderHeight, renderWidth, showGrid, theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function handleNativeWheel(event: WheelEvent) {
      event.preventDefault();
      event.stopPropagation();
      changeZoom(event.deltaY < 0 ? "in" : "out");
    }
    function preventContextMenu(event: MouseEvent) { event.preventDefault(); event.stopPropagation(); }
    canvas.addEventListener("wheel", handleNativeWheel, { passive: false });
    canvas.addEventListener("contextmenu", preventContextMenu);
    return () => {
      canvas.removeEventListener("wheel", handleNativeWheel);
      canvas.removeEventListener("contextmenu", preventContextMenu);
    };
  });

  // 先反算 CSS 缩放，再反算渲染位图与真实像素矩阵坐标。
  function getCell(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const logicalX = (event.clientX - rect.left) * logicalWidth / rect.width;
    const logicalY = (event.clientY - rect.top) * logicalHeight / rect.height;
    const { row, col } = getPixelBlockCoordinates(logicalX, logicalY, pixelSize, gridWidth, gridHeight);
    return { x: col, y: row };
  }

  function scheduleDraftRender() {
    if (draftFrameRef.current !== null) return;
    draftFrameRef.current = requestAnimationFrame(() => {
      draftFrameRef.current = null;
      const matrix = draftRef.current;
      const softness = draftSoftnessRef.current;
      const overrides = draftOverridesRef.current;
      const changed = pendingDrawCellsRef.current.splice(0);
      if (matrix && softness && overrides && changed.length) redrawCells(changed, matrix, softness, overrides);
    });
  }

  function drawLine(from: GridPoint, to: GridPoint) {
    const nextPixels = draftRef.current;
    const nextSoftness = draftSoftnessRef.current;
    const nextOverrides = draftOverridesRef.current;
    if (!nextPixels || !nextSoftness || !nextOverrides) return;
    let changed = false;
    getPixelLine(from, to).forEach(({ x, y }) => {
      const color = tool === "eraser" ? initialPixelGrid[y]?.[x] ?? TRANSPARENT : selectedColor;
      const softness = tool === "eraser" ? 0 : edgeSoftness;
      const isOverridden = tool !== "eraser";
      if (nextPixels[y]?.[x] === color && nextSoftness[y]?.[x] === softness && nextOverrides[y]?.[x] === isOverridden) return;
      nextPixels[y][x] = color;
      nextSoftness[y][x] = softness;
      nextOverrides[y][x] = isOverridden;
      const key = `${x}:${y}`;
      if (!changedCellKeysRef.current.has(key)) {
        changedCellKeysRef.current.add(key);
        changedCellsRef.current.push({ x, y });
      }
      pendingDrawCellsRef.current.push({ x, y });
      changed = true;
    });
    if (changed) { changedRef.current = true; scheduleDraftRender(); }
  }

  function paintPixelBlock(row: number, col: number) {
    drawLine({ x: col, y: row }, { x: col, y: row });
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const isPanGesture = event.button === 2 || event.button === 1 || (event.button === 0 && spacePressedRef.current);
    if (isPanGesture) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      panningRef.current = true;
      panStartRef.current = { x: event.clientX, y: event.clientY, offsetX: pan.x, offsetY: pan.y };
      return;
    }
    if (event.button !== 0) return;
    const { x, y } = getCell(event);
    const color = (draftRef.current || pixelGrid)[y]?.[x] || TRANSPARENT;
    if (tool === "eyedropper") { if (color !== TRANSPARENT) setSelectedColor(color); return; }
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerIdRef.current = event.pointerId;
    drawingRef.current = true;
    changedRef.current = false;
    changedCellsRef.current = [];
    changedCellKeysRef.current = new Set();
    pendingDrawCellsRef.current = [];
    draftRef.current = pixelGrid.map((row) => [...row]);
    draftSoftnessRef.current = pixelSoftness.map((row) => [...row]);
    draftOverridesRef.current = pixelOverrides.map((row) => [...row]);
    const point = { x, y };
    lastPixelRef.current = point;
    paintPixelBlock(y, x);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (panningRef.current) {
      const start = panStartRef.current;
      setPan({ x: start.offsetX + event.clientX - start.x, y: start.offsetY + event.clientY - start.y });
      return;
    }
    const currentPixel = getCell(event);
    const visiblePixels = draftRef.current || pixelGrid;
    setHoveredPixel({ x: currentPixel.x, y: currentPixel.y, color: visiblePixels[currentPixel.y]?.[currentPixel.x] || TRANSPARENT });
    if (!drawingRef.current || activePointerIdRef.current !== event.pointerId) return;
    const lastPixel = lastPixelRef.current;
    if (!lastPixel || (lastPixel.x === currentPixel.x && lastPixel.y === currentPixel.y)) return;
    drawLine(lastPixel, currentPixel);
    lastPixelRef.current = currentPixel;
  }

  function finishStroke() {
    if (drawingRef.current && changedRef.current && draftRef.current && draftSoftnessRef.current && draftOverridesRef.current) {
      const cells = changedCellsRef.current;
      const first = cells[0];
      const action = tool === "eraser" ? "恢复" : "修改";
      const color = tool === "eraser" ? "初始颜色" : selectedColor;
      const description = cells.length === 1 && first ? `${action}坐标(${first.x},${first.y})像素颜色为${color}` : `${action}${cells.length}个像素颜色为${color}`;
      commitPixelGrid(draftRef.current, draftSoftnessRef.current, draftOverridesRef.current, { action: "pixel_change", description });
      emitLocalPixelChanges(cells.map(({ x, y }) => ({ x, y, color: draftRef.current![y][x], softness: draftSoftnessRef.current![y][x], overridden: draftOverridesRef.current![y][x] })));
    }
    drawingRef.current = false;
    changedRef.current = false;
    changedCellsRef.current = [];
    changedCellKeysRef.current = new Set();
    pendingDrawCellsRef.current = [];
    lastPixelRef.current = null;
    activePointerIdRef.current = null;
    if (draftFrameRef.current !== null) { cancelAnimationFrame(draftFrameRef.current); draftFrameRef.current = null; }
    draftRef.current = null;
    draftSoftnessRef.current = null;
    draftOverridesRef.current = null;
  }

  function finishPointerAction(event: PointerEvent<HTMLCanvasElement>) {
    if (panningRef.current) { panningRef.current = false; return; }
    if (activePointerIdRef.current !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    finishStroke();
  }

  function changeZoom(direction: "in" | "out") {
    fitModeRef.current = false;
    setZoom((current) => {
      if (direction === "in") return ZOOM_LEVELS.find((level) => level > current) ?? MAX_ZOOM;
      return [...ZOOM_LEVELS].reverse().find((level) => level < current) ?? MIN_ZOOM;
    });
  }

  function setActualSize() { fitModeRef.current = false; setZoom(100); setPan({ x: 0, y: 0 }); }
  function fitScreen() { fitModeRef.current = true; fitToViewport(); }

  return (
    <section className="theme-editor flex min-h-0 flex-1 flex-col" aria-label="像素画布">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.1] px-4">
        <span className="text-xs text-zinc-500">{gridWidth} × {gridHeight} 格 · {pixelSize}px</span>
        <div className="flex items-center gap-0.5">
          <button type="button" title="缩小" aria-label="缩小" onClick={() => changeZoom("out")} className="grid size-8 place-items-center text-zinc-300 hover:bg-white/[0.08]"><Minus className="size-4" /></button>
          <button type="button" title="当前比例（100%）" aria-label="当前比例（100%）" onClick={setActualSize} className="h-8 min-w-12 px-1 text-xs tabular-nums text-zinc-300 hover:bg-white/[0.08]">{Math.round(zoom)}%</button>
          <button type="button" title="放大" aria-label="放大" onClick={() => changeZoom("in")} className="grid size-8 place-items-center text-zinc-300 hover:bg-white/[0.08]"><Plus className="size-4" /></button>
          <span className="mx-1 h-4 border-l border-white/[0.12]" />
          <button type="button" title="适应窗口" aria-label="适应窗口" onClick={fitScreen} className="grid size-8 place-items-center text-zinc-300 hover:bg-white/[0.08]"><Maximize className="size-3.5" /></button>
        </div>
      </div>
      <div ref={viewportRef} className="pixel-checker flex min-h-0 flex-1 items-center justify-center overflow-auto overscroll-contain p-6">
        <div className="relative shrink-0" style={{ width: displayWidth, height: displayHeight, transform: `translate(${pan.x}px, ${pan.y}px)` }}>
          <canvas ref={canvasRef} width={renderWidth} height={renderHeight} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishPointerAction} onPointerCancel={finishPointerAction} onPointerLeave={() => { if (!drawingRef.current && !panningRef.current) setHoveredPixel(null); }} onAuxClick={(event) => event.preventDefault()} className={panningRef.current ? "size-full cursor-grabbing [image-rendering:pixelated]" : "size-full cursor-crosshair [image-rendering:pixelated]"} />
          <canvas ref={gridCanvasRef} width={renderWidth} height={renderHeight} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full [image-rendering:pixelated]" />
        </div>
      </div>
    </section>
  );
}
