import type { PixelEditorState } from "@/lib/pixel-editor-store";

export interface WorkRecord {
  id: number;
  title: string;
  sourceImageUrl: string | null;
  pixelImageUrl: string | null;
  pixelSize: number;
  imageWidth: number;
  imageHeight: number;
  gridWidth: number;
  gridHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  pixelData: string;
  reviewStatus: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";
  reviewNote: string | null;
  publishedTime: string | null;
  createTime: string;
  updateTime: string;
}

export interface CommunityWork {
  id: number;
  title: string;
  sourceImageUrl: string | null;
  pixelImageUrl: string | null;
  pixelSize: number;
  imageWidth: number;
  imageHeight: number;
  publishedTime: string | null;
}

export function buildWorkPayload(state: PixelEditorState, title = state.workTitle || "Untitled pixel work") {
  return {
    title,
    sourceImageUrl: state.sourceImageUrl,
    pixelImageUrl: null,
    size: state.pixelSize,
    imageWidth: state.sourceWidth,
    imageHeight: state.sourceHeight,
    gridWidth: state.gridWidth,
    gridHeight: state.gridHeight,
    canvasWidth: state.canvasWidth,
    canvasHeight: state.canvasHeight,
    pixelData: {
      pixelGrid: state.pixelGrid,
      pixelSoftness: state.pixelSoftness,
      pixelOverrides: state.pixelOverrides,
      palette: state.palette,
      selectedColor: state.selectedColor,
      edgeSoftness: state.edgeSoftness,
    },
    // A full history entry contains an entire canvas. Persist one recovery
    // snapshot instead of nesting every undo entry inside the work document.
    history: [{
      id: 1,
      operationType: "initial",
      operationDesc: "Saved editor state",
      operationTime: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
      pixelData: state.pixelGrid,
      softnessData: state.pixelSoftness,
      overrideData: state.pixelOverrides,
    }],
  };
}

export function absoluteImageUrl(url?: string | null) {
  if (!url || url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}${url}`;
}
