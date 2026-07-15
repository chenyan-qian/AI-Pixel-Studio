"use client";

import { LogOut, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ImagePreview, { type UploadedImage } from "@/components/ImagePreview";
import PixelSizeSelector, { type PixelSize } from "@/components/PixelSizeSelector";
import StartGenerateButton from "@/components/StartGenerateButton";
import UploadArea from "@/components/UploadArea";
import { AuthUser, clearSession, getToken, getUser } from "@/lib/auth";
import request from "@/lib/request";

/** Response returned by the image upload endpoint. */
interface UploadResponse {
  code: number;
  msg: string;
  data: { fileName: string; url: string; width: number; height: number };
}

/** Uses an absolute API address so the browser can display the backend resource. */
function getUploadUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}${url}`;
}

/** Authenticated pixel-art workspace home page. */
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [pixelSize, setPixelSize] = useState<PixelSize>(64);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setUser(getUser());
  }, [router]);

  /** Releases the browser preview URL whenever the user replaces an uploaded image. */
  useEffect(() => {
    return () => {
      if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    };
  }, [image]);

  /** Uploads the selected file and retains the metadata required by later AI requests. */
  const handleFileSelected = useCallback(async (file: File) => {
    setUploadError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await request.post<FormData, UploadResponse>("/api/image/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.code !== 200 || !response.data) {
        throw new Error(response.msg || "图片上传失败，请稍后重试。");
      }
      setImage({
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

  /** Logs the current task payload; AI generation is deliberately deferred to the next phase. */
  function handleStartGenerate() {
    if (!image) return;
    console.log({ image: image.name, pixelSize });
  }

  /** Clears the saved session before returning to the login screen. */
  function logout() {
    clearSession();
    router.replace("/login");
  }

  if (!user) {
    return <main className="grid min-h-screen place-items-center bg-[#08090d] text-sm text-zinc-500">正在验证登录状态…</main>;
  }

  return (
    <main className="grid-background min-h-screen bg-[#08090d] px-5 py-6 text-zinc-100 sm:px-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-white/[0.1] pb-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center bg-violet-500"><Sparkles className="size-4" /></span>
          <span className="text-sm font-semibold">AI Pixel Studio</span>
        </div>
        <button className="inline-flex h-9 items-center gap-2 border border-white/[0.12] px-3 text-sm text-zinc-300 transition hover:border-white/[0.22] hover:text-white" onClick={logout}>
          <LogOut className="size-4" />退出
        </button>
      </header>

      <section className="mx-auto max-w-6xl py-12 sm:py-16" aria-labelledby="workspace-title">
        <p className="text-sm text-violet-300">创作工作台</p>
        <h1 id="workspace-title" className="mt-3 text-3xl font-semibold text-white sm:text-4xl">你好，{user.nickname || user.username}</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400">上传一张图片，选择目标像素规格，准备开始你的像素艺术创作。</p>

        <div className="mt-9 max-w-3xl border border-white/[0.12] bg-[#10111a]/90 p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-7">
          <h2 className="text-lg font-semibold text-white">上传图片</h2>
          <p className="mt-1 text-sm text-zinc-500">支持 JPG、JPEG、PNG、WEBP 格式。</p>
          <UploadArea isUploading={uploading} onFileSelected={handleFileSelected} />
          {uploadError && <p className="mt-4 border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" role="alert">{uploadError}</p>}

          {image && (
            <div className="mt-7 space-y-7 border-t border-white/[0.1] pt-7">
              <ImagePreview image={image} />
              <PixelSizeSelector value={pixelSize} onChange={setPixelSize} />
              <StartGenerateButton disabled={!image || !pixelSize} onClick={handleStartGenerate} />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
