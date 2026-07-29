"use client";

import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Sparkles, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { refreshSession, saveSession } from "@/lib/auth";
import request from "@/lib/request";
import { ThemeToggle } from "@/components/ThemeToggle";

interface LoginResponse {
  code: number;
  msg: string;
  data: { token: string; username: string; nickname: string; avatar?: string | null; role: "USER" | "ADMIN" };
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try {
      const response = await request.post<never, LoginResponse>("/api/user/login", { username, password });
      if (response.code !== 200 || !response.data?.token) throw new Error(response.msg || "登录失败");
      saveSession(response.data.token);
      const user = await refreshSession();
      if (!user) throw new Error("Unable to verify login session");
      // 登录成功后先回到首页，由用户自行决定是否进入工作台。
      router.replace(user.role === "ADMIN" ? "/admin" : "/");
    } catch (caughtError) {
      const responseMessage = (caughtError as { response?: { data?: { msg?: string } } })?.response?.data?.msg;
      setError(responseMessage || (caughtError instanceof Error ? caughtError.message : "登录失败，请稍后重试"));
    } finally { setSubmitting(false); }
  }

  return (
    <main className="grid-background relative grid min-h-screen place-items-center overflow-hidden bg-[#08090d] px-5 py-10 text-zinc-100">
      <div className="absolute right-5 top-5 z-10"><ThemeToggle /></div>
      <div className="absolute inset-x-0 top-0 h-[440px] bg-[radial-gradient(ellipse_at_top,rgba(91,77,183,0.23),transparent_64%)]" />
      <section className="relative w-full max-w-[420px] border border-white/[0.12] bg-[#10111a]/90 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-9" aria-labelledby="login-title">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white"><span className="grid size-9 place-items-center rounded-md bg-violet-500 text-white"><Sparkles className="size-4" /></span>PixelVerse</Link>
        <div className="mt-9"><p className="text-sm text-violet-300">欢迎回来</p><h1 id="login-title" className="mt-2 text-2xl font-semibold text-white">登录工作台</h1><p className="mt-2 text-sm leading-6 text-zinc-400">继续你的像素艺术创作。</p></div>
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <label className="block"><span className="mb-2 block text-sm text-zinc-300">用户名</span><span className="flex h-11 items-center border border-white/[0.13] bg-black/15 px-3 focus-within:border-violet-400"><UserRound className="size-4 shrink-0 text-zinc-500" /><input className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-zinc-600" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="输入用户名" autoComplete="username" minLength={3} maxLength={32} required /></span></label>
          <label className="block"><span className="mb-2 block text-sm text-zinc-300">密码</span><span className="flex h-11 items-center border border-white/[0.13] bg-black/15 px-3 focus-within:border-violet-400"><LockKeyhole className="size-4 shrink-0 text-zinc-500" /><input className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-zinc-600" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} placeholder="输入密码" autoComplete="current-password" minLength={6} maxLength={64} required /><button className="grid size-7 place-items-center text-zinc-500 hover:text-white" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "隐藏密码" : "显示密码"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label>
          {error && <p className="border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
          <button className="h-11 w-full bg-violet-500 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? "正在登录..." : "登录"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">还没有账号？ <Link className="text-violet-300 hover:text-violet-200" href="/register">去注册</Link></p>
      </section>
    </main>
  );
}
