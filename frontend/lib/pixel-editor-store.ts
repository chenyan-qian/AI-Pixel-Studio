import { create } from "zustand";

export const TRANSPARENT = "transparent";
export type EditorTool = "pencil" | "eraser" | "fill" | "eyedropper";
export type PixelMatrix = string[][];
export type SoftnessMatrix = number[][];

export interface PixelCell {
  x: number;
  y: number;
  color: string;
}

export interface HoveredPixel {
  x: number;
  y: number;
  color: string;
}

interface PixelSnapshot {
  pixels: PixelMatrix;
  softness: SoftnessMatrix;
}

interface PixelEditorState {
  size: number;
  pixels: PixelMatrix;
  pixelSoftness: SoftnessMatrix;
  initialPixels: PixelMatrix;
  sourceImageUrl: string | null;
  sourceWidth: number;
  sourceHeight: number;
  selectedColor: string;
  tool: EditorTool;
  edgeSoftness: number;
  palette: string[];
  history: PixelSnapshot[];
  historyIndex: number;
  hoveredPixel: HoveredPixel | null;
  initialize: (size: number, cells: PixelCell[], sourceImage: { url: string; width: number; height: number }) => void;
  setSelectedColor: (color: string) => void;
  setTool: (tool: EditorTool) => void;
  setEdgeSoftness: (value: number) => void;
  addPaletteColor: (color?: string) => void;
  setHoveredPixel: (pixel: HoveredPixel | null) => void;
  commitPixels: (pixels: PixelMatrix, pixelSoftness: SoftnessMatrix) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

function cloneMatrix(matrix: PixelMatrix) {
  return matrix.map((row) => [...row]);
}

function createTransparentMatrix(size: number): PixelMatrix {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => TRANSPARENT));
}

function cloneSoftnessMatrix(matrix: SoftnessMatrix) {
  return matrix.map((row) => [...row]);
}

function createSoftnessMatrix(size: number, value = 0): SoftnessMatrix {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => value));
}

/** 像素编辑器的唯一状态源，历史记录始终保存矩阵快照。 */
export const usePixelEditorStore = create<PixelEditorState>((set, get) => ({
  size: 0,
  pixels: [],
  pixelSoftness: [],
  initialPixels: [],
  sourceImageUrl: null,
  sourceWidth: 0,
  sourceHeight: 0,
  selectedColor: "#FF5733",
  tool: "pencil",
  edgeSoftness: 0,
  palette: ["#FF5733", "#FF0000", "#00C853", "#2563EB", "#111827", "#FFFFFF"],
  history: [],
  historyIndex: -1,
  hoveredPixel: null,

  initialize: (size, cells, sourceImage) => {
    const matrix = createTransparentMatrix(size);
    // 后端 cells 使用 x/y 坐标，编辑器矩阵按 pixels[y][x] 存储。
    cells.forEach((cell) => { if (matrix[cell.y]?.[cell.x] !== undefined) matrix[cell.y][cell.x] = cell.color; });
    const snapshot: PixelSnapshot = { pixels: cloneMatrix(matrix), softness: createSoftnessMatrix(size) };
    set({ size, pixels: cloneMatrix(snapshot.pixels), pixelSoftness: cloneSoftnessMatrix(snapshot.softness), initialPixels: cloneMatrix(snapshot.pixels), sourceImageUrl: sourceImage.url, sourceWidth: sourceImage.width, sourceHeight: sourceImage.height, history: [snapshot], historyIndex: 0, hoveredPixel: null });
  },

  setSelectedColor: (color) => set({ selectedColor: color.toUpperCase() }),
  setTool: (tool) => set({ tool }),
  // 柔化值只会在下一次编辑时写入对应单元，不会重绘已有修改。
  setEdgeSoftness: (edgeSoftness) => set({ edgeSoftness: Math.max(0, Math.min(100, edgeSoftness)) }),
  addPaletteColor: (color) => {
    const nextColor = (color || get().selectedColor).toUpperCase();
    set((state) => state.palette.includes(nextColor) ? state : { palette: [...state.palette, nextColor] });
  },
  setHoveredPixel: (hoveredPixel) => set({ hoveredPixel }),

  commitPixels: (pixels, pixelSoftness) => set((state) => {
    const snapshot: PixelSnapshot = { pixels: cloneMatrix(pixels), softness: cloneSoftnessMatrix(pixelSoftness) };
    const history = [...state.history.slice(0, state.historyIndex + 1), snapshot];
    return { pixels: cloneMatrix(snapshot.pixels), pixelSoftness: cloneSoftnessMatrix(snapshot.softness), history, historyIndex: history.length - 1 };
  }),
  undo: () => set((state) => {
    if (state.historyIndex <= 0) return state;
    const historyIndex = state.historyIndex - 1;
    return { pixels: cloneMatrix(state.history[historyIndex].pixels), pixelSoftness: cloneSoftnessMatrix(state.history[historyIndex].softness), historyIndex };
  }),
  redo: () => set((state) => {
    if (state.historyIndex >= state.history.length - 1) return state;
    const historyIndex = state.historyIndex + 1;
    return { pixels: cloneMatrix(state.history[historyIndex].pixels), pixelSoftness: cloneSoftnessMatrix(state.history[historyIndex].softness), historyIndex };
  }),
  clear: () => {
    const { size, edgeSoftness } = get();
    get().commitPixels(createTransparentMatrix(size), createSoftnessMatrix(size, edgeSoftness));
  },
}));

/** 复制矩阵后修改一个单元，供连续绘制过程创建临时预览。 */
export function paintMatrixPixel(matrix: PixelMatrix, x: number, y: number, color: string) {
  if (!matrix[y] || matrix[y][x] === undefined || matrix[y][x] === color) return matrix;
  const next = cloneMatrix(matrix);
  next[y][x] = color;
  return next;
}

/** 复制柔化矩阵后记录当前编辑单元使用的柔化值。 */
export function paintMatrixSoftness(matrix: SoftnessMatrix, x: number, y: number, softness: number) {
  if (!matrix[y] || matrix[y][x] === undefined || matrix[y][x] === softness) return matrix;
  const next = cloneSoftnessMatrix(matrix);
  next[y][x] = softness;
  return next;
}

/** 使用四方向洪泛算法填充与起点颜色相同的连续区域。 */
export function fillMatrix(matrix: PixelMatrix, x: number, y: number, color: string) {
  const target = matrix[y]?.[x];
  if (target === undefined || target === color) return matrix;
  const next = cloneMatrix(matrix);
  const stack: Array<[number, number]> = [[x, y]];
  while (stack.length > 0) {
    const [currentX, currentY] = stack.pop()!;
    if (next[currentY]?.[currentX] !== target) continue;
    next[currentY][currentX] = color;
    stack.push([currentX + 1, currentY], [currentX - 1, currentY], [currentX, currentY + 1], [currentX, currentY - 1]);
  }
  return next;
}
