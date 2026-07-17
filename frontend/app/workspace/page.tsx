"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImagePreview, { type UploadedImage } from "@/components/ImagePreview";
import PixelSizeSelector, { type PixelSize } from "@/components/PixelSizeSelector";
import StartGenerateButton from "@/components/StartGenerateButton";
import UploadArea from "@/components/UploadArea";
import { Navbar } from "@/components/navbar";
import { type AuthUser, clearSession, getToken, getUser } from "@/lib/auth";
import { type PixelCell, usePixelEditorStore } from "@/lib/pixel-editor-store";
import request from "@/lib/request";

interface UploadResponse {
  code: number;
  msg: string;
  data: { fileName: string; url: string; width: number; height: number };
}

interface PixelGrid {
  size: number;
  pixels: PixelCell[];
}

interface PixelAnalyzeResponse {
  code: number;
  msg: string;
  data: PixelGrid;
}

function getUploadUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}${url}`;
}

/** 需要登录的工作台，负责图片上传、网格分析和像素级颜色编辑。 */
export default function WorkspacePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [originalImage, setOriginalImage] = useState<UploadedImage | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pixelSize, setPixelSize] = useState<PixelSize>(64);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [processError, setProcessError] = useState("");

  useEffect(() => {
    const savedUser = getToken() ? getUser() : null;
    if (!savedUser) {
      clearSession();
      router.replace("/login");
      return;
    }
    setUser(savedUser);
    setCheckedAuth(true);
  }, [router]);

  useEffect(() => () => {
    // 更换图片或离开工作台时释放浏览器创建的本地预览 URL。
    if (originalImage?.previewUrl) URL.revokeObjectURL(originalImage.previewUrl);
  }, [originalImage]);

  const handleFileSelected = useCallback(async (file: File) => {
    // 新图片会使现有矩阵和局部编辑失效，因此先清空旧结果。
    setUploadError("");
    setProcessError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await request.post<FormData, UploadResponse>("/api/image/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      if (response.code !== 200 || !response.data) throw new Error(response.msg || "图片上传失败，请稍后重试。");
      setSourceFile(file);
      setOriginalImage({
        name: response.data.fileName,
        size: file.size,
        width: response.data.width,
        height: response.data.height,
        previewUrl: URL.createObjectURL(file),
        uploadedUrl: getUploadUrl(response.data.url),
      });
    } catch (error) {
      const responseMessage = (error as { response?: { data?: { msg?: string } } })?.response?.data?.msg;
      setUploadError(responseMessage || (error instanceof Error ? error.message : "图片上传失败，请稍后重试。"));
    } finally {
      setUploading(false);
    }
  }, []);

  function handlePixelSizeChange(size: PixelSize) {
    // 网格规格变化后必须重新按原图区域映射生成矩阵。
    setPixelSize(size);
  }

  async function handleStartGenerate() {
    if (!sourceFile || !originalImage) return;
    setProcessError("");
    setProcessing(true);
    // 分析接口直接接收当前原始文件与目标网格规格。
    const formData = new FormData();
    formData.append("file", sourceFile);
    formData.append("pixelSize", String(pixelSize));

    try {
      const response = await request.post<FormData, PixelAnalyzeResponse>("/api/pixel/analyze", formData, { headers: { "Content-Type": "multipart/form-data" } });
      if (response.code !== 200 || !response.data?.pixels) throw new Error(response.msg || "像素网格生成失败，请稍后重试。");
      // 矩阵写入全局编辑器状态后跳转，编辑页不再依赖图片文件或处理结果图片。
      // 使用服务端图片地址而非本地 Blob URL，页面跳转后底图仍可正常加载。
      usePixelEditorStore.getState().initialize(response.data.size, response.data.pixels, {
        url: originalImage.uploadedUrl,
        width: originalImage.width,
        height: originalImage.height,
      });
      router.push("/editor");
    } catch (error) {
      const responseMessage = (error as { response?: { data?: { msg?: string } } })?.response?.data?.msg;
      setProcessError(responseMessage || (error instanceof Error ? error.message : "像素网格生成失败，请稍后重试。"));
    } finally {
      setProcessing(false);
    }
  }

  if (!checkedAuth || !user) return <main className="grid min-h-screen place-items-center bg-[#08090d] text-sm text-zinc-500">正在验证登录状态...</main>;

  return (
    <main className="grid-background min-h-screen bg-[#08090d] px-5 pb-12 pt-28 text-zinc-100 sm:px-8">
      <Navbar />
      <section className="mx-auto max-w-6xl py-8 sm:py-12" aria-labelledby="workspace-title">
        <p className="text-sm text-violet-300">创作工作台</p>
        <h1 id="workspace-title" className="mt-3 text-3xl font-semibold text-white sm:text-4xl">你好，{user.nickname || user.username}</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400">上传图片并生成可逐格编辑的像素网格。</p>
        <div className="mt-9 max-w-5xl border border-white/[0.12] bg-[#10111a]/90 p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-7">
          <h2 className="text-lg font-semibold text-white">上传图片</h2>
          <p className="mt-1 text-sm text-zinc-500">像素网格分析支持 JPG、JPEG 和 PNG 格式。</p>
          <UploadArea isUploading={uploading} onFileSelected={handleFileSelected} />
          {uploadError && <p className="mt-4 border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" role="alert">{uploadError}</p>}
          {originalImage && <div className="mt-7 space-y-7 border-t border-white/[0.1] pt-7">
            <ImagePreview image={originalImage} />
            <PixelSizeSelector value={pixelSize} onChange={handlePixelSizeChange} />
            <div>
              <StartGenerateButton disabled={!sourceFile || processing} isProcessing={processing} onClick={handleStartGenerate} />
              {processError && <p className="mt-4 border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" role="alert">{processError}</p>}
            </div>
          </div>}
        </div>
      </section>
    </main>
  );
}
