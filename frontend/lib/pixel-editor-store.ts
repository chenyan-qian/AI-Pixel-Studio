import { create } from "zustand";

export const TRANSPARENT = "transparent";
/** 最近保留完整矩阵快照、可直接恢复的历史记录数量。 */
export const FULL_SNAPSHOT_LIMIT = 20;
export type EditorTool = "pencil" | "eraser" | "fill" | "eyedropper";
export type PixelMatrix = string[][];
export type SoftnessMatrix = number[][];
export type HistoryAction = "initial" | "pixel_change" | "fill" | "clear";

export interface PixelCell { x: number; y: number; color: string; }
export interface HoveredPixel { x: number; y: number; color: string; }
export interface PixelSnapshot { pixels: PixelMatrix; softness: SoftnessMatrix; }

export interface HistoryRecord {
  id: number;
  action: HistoryAction;
  description: string;
  timestamp: string;
  /** 新近记录直接保留矩阵数据，更早的记录只保留压缩快照。 */
  pixelData?: PixelMatrix;
  softnessData?: SoftnessMatrix;
  compressedSnapshot?: string;
}

export interface HistoryCommit { action: Exclude<HistoryAction, "initial">; description: string; }

interface PixelEditorState {
  gridWidth: number;
  gridHeight: number;
  pixelSize: number;
  canvasWidth: number;
  canvasHeight: number;
  pixels: PixelMatrix;
  pixelSoftness: SoftnessMatrix;
  initialPixels: PixelMatrix;
  sourceImageUrl: string | null;
  sourceWidth: number;
  sourceHeight: number;
  workId: number | null;
  selectedColor: string;
  tool: EditorTool;
  edgeSoftness: number;
  palette: string[];
  history: HistoryRecord[];
  historyIndex: number;
  hoveredPixel: HoveredPixel | null;
  initialize: (gridWidth: number, gridHeight: number, pixelSize: number, canvasWidth: number, canvasHeight: number, cells: PixelCell[], sourceImage: { url: string; width: number; height: number }) => void;
  setWorkId: (workId: number) => void;
  setSelectedColor: (color: string) => void;
  setTool: (tool: EditorTool) => void;
  setEdgeSoftness: (value: number) => void;
  addPaletteColor: (color?: string) => void;
  setHoveredPixel: (pixel: HoveredPixel | null) => void;
  commitPixels: (pixels: PixelMatrix, pixelSoftness: SoftnessMatrix, commit: HistoryCommit) => void;
  goToHistory: (index: number) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

function cloneMatrix(matrix: PixelMatrix) { return matrix.map((row) => [...row]); }
function cloneSoftnessMatrix(matrix: SoftnessMatrix) { return matrix.map((row) => [...row]); }
function createTransparentMatrix(width: number, height: number): PixelMatrix { return Array.from({ length: height }, () => Array.from({ length: width }, () => TRANSPARENT)); }
function createSoftnessMatrix(width: number, height: number, value = 0): SoftnessMatrix { return Array.from({ length: height }, () => Array.from({ length: width }, () => value)); }
function now() { return new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }); }

/** 用行程编码压缩旧快照，避免一直保留完整矩阵对象。 */
function compressSnapshot(snapshot: PixelSnapshot) {
  const values = snapshot.pixels.flat().map((color, index) => `${color}|${snapshot.softness.flat()[index] ?? 0}`);
  const encoded: Array<[string, number]> = [];
  values.forEach((value) => {
    const last = encoded.at(-1);
    if (last?.[0] === value) last[1] += 1;
    else encoded.push([value, 1]);
  });
  return JSON.stringify({ width: snapshot.pixels[0]?.length || 0, height: snapshot.pixels.length, values: encoded });
}

function decompressSnapshot(value: string): PixelSnapshot {
  const parsed = JSON.parse(value) as { width?: number; height?: number; size?: number; values: Array<[string, number]> };
  const width = parsed.width ?? parsed.size ?? 0;
  const height = parsed.height ?? parsed.size ?? 0;
  const cells = parsed.values.flatMap(([entry, count]) => Array.from({ length: count }, () => entry));
  const pixels = createTransparentMatrix(width, height);
  const softness = createSoftnessMatrix(width, height);
  cells.forEach((entry, index) => {
    const [color, rawSoftness] = entry.split("|");
    const y = Math.floor(index / width);
    const x = index % width;
    pixels[y][x] = color;
    softness[y][x] = Number(rawSoftness);
  });
  return { pixels, softness };
}

/** 统一恢复最近的完整快照或较早的压缩快照。 */
function materialize(record: HistoryRecord): PixelSnapshot {
  if (record.pixelData && record.softnessData) return { pixels: record.pixelData, softness: record.softnessData };
  if (record.compressedSnapshot) return decompressSnapshot(record.compressedSnapshot);
  throw new Error("历史记录快照不完整");
}

/** 仅将最近 20 步之外的历史记录压缩为 RLE 快照。 */
function compact(records: HistoryRecord[]) {
  const firstFullIndex = Math.max(0, records.length - FULL_SNAPSHOT_LIMIT);
  return records.map((record, index) => {
    if (index >= firstFullIndex || !record.pixelData || !record.softnessData) return record;
    return { ...record, compressedSnapshot: compressSnapshot({ pixels: record.pixelData, softness: record.softnessData }), pixelData: undefined, softnessData: undefined };
  });
}

export const usePixelEditorStore = create<PixelEditorState>((set, get) => ({
  gridWidth: 0, gridHeight: 0, pixelSize: 0, canvasWidth: 0, canvasHeight: 0, pixels: [], pixelSoftness: [], initialPixels: [], sourceImageUrl: null, sourceWidth: 0, sourceHeight: 0, workId: null,
  selectedColor: "#FF5733", tool: "pencil", edgeSoftness: 0,
  palette: ["#FF5733", "#FF0000", "#00C853", "#2563EB", "#111827", "#FFFFFF"],
  history: [], historyIndex: -1, hoveredPixel: null,

  initialize: (gridWidth, gridHeight, pixelSize, canvasWidth, canvasHeight, cells, sourceImage) => {
    const matrix = createTransparentMatrix(gridWidth, gridHeight);
    cells.forEach((cell) => { if (matrix[cell.y]?.[cell.x] !== undefined) matrix[cell.y][cell.x] = cell.color; });
    const softness = createSoftnessMatrix(gridWidth, gridHeight);
    set({ gridWidth, gridHeight, pixelSize, canvasWidth, canvasHeight, pixels: cloneMatrix(matrix), pixelSoftness: cloneSoftnessMatrix(softness), initialPixels: cloneMatrix(matrix), sourceImageUrl: sourceImage.url, sourceWidth: sourceImage.width, sourceHeight: sourceImage.height, workId: null, history: [{ id: 1, action: "initial", description: "初始像素化", timestamp: now(), pixelData: cloneMatrix(matrix), softnessData: cloneSoftnessMatrix(softness) }], historyIndex: 0, hoveredPixel: null });
  },
  setWorkId: (workId) => set({ workId }),
  setSelectedColor: (color) => set({ selectedColor: color.toUpperCase() }),
  setTool: (tool) => set({ tool }),
  setEdgeSoftness: (edgeSoftness) => set({ edgeSoftness: Math.max(0, Math.min(100, edgeSoftness)) }),
  addPaletteColor: (color) => { const nextColor = (color || get().selectedColor).toUpperCase(); set((state) => state.palette.includes(nextColor) ? state : { palette: [...state.palette, nextColor] }); },
  setHoveredPixel: (hoveredPixel) => set({ hoveredPixel }),
  commitPixels: (pixels, pixelSoftness, commit) => set((state) => {
    // 回退后继续编辑时，丢弃旧的前进分支，只保留当前活动分支。
    const activeRecords = state.history.slice(0, state.historyIndex + 1);
    const nextId = Math.max(0, ...activeRecords.map((record) => record.id)) + 1;
    const next: HistoryRecord = { id: nextId, action: commit.action, description: commit.description, timestamp: now(), pixelData: cloneMatrix(pixels), softnessData: cloneSoftnessMatrix(pixelSoftness) };
    const history = compact([...activeRecords, next]);
    return { pixels: cloneMatrix(pixels), pixelSoftness: cloneSoftnessMatrix(pixelSoftness), history, historyIndex: history.length - 1 };
  }),
  goToHistory: (historyIndex) => set((state) => {
    if (historyIndex < 0 || historyIndex >= state.history.length) return state;
    const snapshot = materialize(state.history[historyIndex]);
    return { pixels: cloneMatrix(snapshot.pixels), pixelSoftness: cloneSoftnessMatrix(snapshot.softness), historyIndex };
  }),
  // 撤销和重做与点击历史记录面板时走同一套恢复逻辑。
  undo: () => { const { historyIndex, goToHistory } = get(); if (historyIndex > 0) goToHistory(historyIndex - 1); },
  redo: () => { const { historyIndex, history, goToHistory } = get(); if (historyIndex < history.length - 1) goToHistory(historyIndex + 1); },
  clear: () => { const { gridWidth, gridHeight, edgeSoftness } = get(); get().commitPixels(createTransparentMatrix(gridWidth, gridHeight), createSoftnessMatrix(gridWidth, gridHeight, edgeSoftness), { action: "clear", description: "清空画布" }); },
}));

export function paintMatrixPixel(matrix: PixelMatrix, x: number, y: number, color: string) { if (!matrix[y] || matrix[y][x] === undefined || matrix[y][x] === color) return matrix; const next = cloneMatrix(matrix); next[y][x] = color; return next; }
export function paintMatrixSoftness(matrix: SoftnessMatrix, x: number, y: number, softness: number) { if (!matrix[y] || matrix[y][x] === undefined || matrix[y][x] === softness) return matrix; const next = cloneSoftnessMatrix(matrix); next[y][x] = softness; return next; }
export function fillMatrix(matrix: PixelMatrix, x: number, y: number, color: string) {
  const target = matrix[y]?.[x]; if (target === undefined || target === color) return matrix;
  const next = cloneMatrix(matrix); const stack: Array<[number, number]> = [[x, y]];
  while (stack.length > 0) { const [currentX, currentY] = stack.pop()!; if (next[currentY]?.[currentX] !== target) continue; next[currentY][currentX] = color; stack.push([currentX + 1, currentY], [currentX - 1, currentY], [currentX, currentY + 1], [currentX, currentY - 1]); }
  return next;
}
