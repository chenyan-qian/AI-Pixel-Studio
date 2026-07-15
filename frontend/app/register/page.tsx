"use client";

import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Sparkles, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import request from "@/lib/request";

interface ApiResponse { code: number; msg: string; }

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try {
      const response = await request.post<never, ApiResponse>("/api/user/register", { username, password, nickname });
      if (response.code !== 200) throw new Error(response.msg || "注册失败");
      router.replace("/login");
    } catch (caughtError) {
      const responseMessage = (caughtError as { response?: { data?: { msg?: string } } })?.response?.data?.msg;
      setError(responseMessage || (caughtError instanceof Error ? caughtError.message : "注册失败，请稍后重试"));
    } finally { setSubmitting(false); }
  }

  return (
    <main className="grid-background relative grid min-h-screen place-items-center overflow-hidden bg-[#08090d] px-5 py-10 text-zinc-100">
      <div className="absolute inset-x-0 top-0 h-[440px] bg-[radial-gradient(ellipse_at_top,rgba(47,127,170,0.20),transparent_64%)]" />
      <section className="relative w-full max-w-[420px] border border-white/[0.12] bg-[#10111a]/90 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-9" aria-labelledby="register-title">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white"><span className="grid size-9 place-items-center bg-violet-500 text-white"><Sparkles className="size-4" /></span>AI Pixel Studio</Link>
        <div className="mt-9"><p className="text-sm text-sky-300">开始创作</p><h1 id="register-title" className="mt-2 text-2xl font-semibold text-white">创建账号</h1><p className="mt-2 text-sm leading-6 text-zinc-400">建立你的像素艺术工作台。</p></div>
        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block"><span className="mb-2 block text-sm text-zinc-300">用户名</span><span className="flex h-11 items-center border border-white/[0.13] bg-black/15 px-3 focus-within:border-violet-400"><UserRound className="size-4 shrink-0 text-zinc-500" /><input className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-zinc-600" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="3-32 位用户名" autoComplete="username" minLength={3} maxLength={32} required /></span></label>
          <label className="block"><span className="mb-2 block text-sm text-zinc-300">昵称 <span className="text-zinc-600">（可选）</span></span><span className="flex h-11 items-center border border-white/[0.13] bg-black/15 px-3 focus-within:border-violet-400"><UserRound className="size-4 shrink-0 text-zinc-500" /><input className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-zinc-600" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="展示给其他创作者的名称" maxLength={32} /></span></label>
          <label className="block"><span className="mb-2 block text-sm text-zinc-300">密码</span><span className="flex h-11 items-center border border-white/[0.13] bg-black/15 px-3 focus-within:border-violet-400"><LockKeyhole className="size-4 shrink-0 text-zinc-500" /><input className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-zinc-600" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} placeholder="至少 6 位密码" autoComplete="new-password" minLength={6} maxLength={64} required /><button className="grid size-7 place-items-center text-zinc-500 hover:text-white" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "隐藏密码" : "显示密码"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label>
          {error && <p className="border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
          <button className="h-11 w-full bg-violet-500 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? "正在创建..." : "创建账号"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">已有账号？ <Link className="text-violet-300 hover:text-violet-200" href="/login">去登录</Link></p>
      </section>
    </main>
  );
}
