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

export interface CommunityArtworkRecord {
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
  publishedTime: string | null;
  createTime: string;
}

export interface CommunityVersion {
  id: number;
  versionNumber: number;
  creatorId: number;
  creator: string;
  description: string;
  createTime: string;
  width: number;
  height: number;
}

export interface CommunityArtworkDetail {
  artwork: CommunityArtworkRecord;
  username: string;
  avatar: string | null;
  permission: { visibility: "PRIVATE" | "PUBLIC" | "PUBLIC_COLLAB"; allowEdit: boolean; allowFork: boolean };
  onlineCount: number;
  modificationCount: number;
  latestVersion: CommunityVersion | null;
  versions: CommunityVersion[];
  contributors: Array<{ userId: number; username: string; avatar: string | null; pixelCount: number }>;
}

export interface CommunityWork {
  id: number;
  title: string;
  imageUrl: string | null;
  username: string;
  avatar: string | null;
  pixelSize: number;
  width: number;
  height: number;
  likeCount: number;
  commentCount: number;
  createTime: string | null;
  collaborationEnabled: boolean;
  onlineCount: number;
  modificationCount: number;
  uiKey?: string;
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
