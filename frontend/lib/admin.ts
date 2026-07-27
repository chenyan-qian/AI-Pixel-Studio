export interface ApiResult<T> { code: number; msg: string; data: T; }
export interface Statistics { userCount: number; artworkCount: number; todayUpload: number; todayGenerate: number; }
export interface AdminUser { id: number; username: string; createTime: string; role: "USER" | "ADMIN"; status: number; }
export interface Artwork { id: number; userId: number; username: string; title: string; pixelSize: number; sourceImageUrl?: string | null; pixelImageUrl?: string | null; reviewStatus: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED"; reviewNote?: string | null; publishedTime?: string | null; finalPixelData: string; createTime: string; updateTime: string; }
export interface ManagedFile { id: number | null; fileName: string; originalName: string; fileSize: number; fileType: string; username: string; createTime: string; url: string; }
export interface OperationLog { id: number; userId: number; username: string; operation: string; createTime: string; }
export const formatDate = (value?: string) => value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "—";
export const formatSize = (value: number) => value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
