"use client";

import { Eye, Power, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import request from "@/lib/request";
import { type AdminUser, type ApiResult, formatDate } from "@/lib/admin";

export default function UserManage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => request.get<never, ApiResult<AdminUser[]>>("/admin/users")
    .then((result) => setUsers(result.data)).catch(() => setError("用户列表加载失败。")), []);
  useEffect(() => { load(); }, [load]);
  async function changeStatus(user: AdminUser) {
    if (!confirm(`确认${user.status === 1 ? "禁用" : "启用"}用户“${user.username}”？`)) return;
    try { await request.put("/admin/user/status", { id: user.id, status: user.status === 1 ? 0 : 1 }); load(); }
    catch { setError("操作失败，请稍后重试。"); }
  }
  async function remove(user: AdminUser) {
    if (!confirm(`确认永久删除用户“${user.username}”及其作品吗？`)) return;
    try { await request.delete(`/admin/user/${user.id}`); setSelected(null); load(); }
    catch { setError("删除失败，请稍后重试。"); }
  }
  return <section><p className="text-sm text-violet-300">USER MANAGEMENT</p><h1 className="mt-2 text-2xl font-semibold">用户管理</h1>{error && <p className="mt-5 text-sm text-rose-300">{error}</p>}<div className="mt-7 overflow-x-auto rounded-xl border border-white/[0.09] bg-[#15182a]"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b border-white/[0.08] text-slate-400"><tr><th className="p-4">用户 ID</th><th className="p-4">用户名</th><th className="p-4">注册时间</th><th className="p-4">角色</th><th className="p-4">状态</th><th className="p-4">操作</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-white/[0.05] last:border-0"><td className="p-4 text-slate-400">#{user.id}</td><td className="p-4">{user.username}</td><td className="p-4 text-slate-400">{formatDate(user.createTime)}</td><td className="p-4"><span className="rounded bg-violet-400/10 px-2 py-1 text-xs text-violet-200">{user.role}</span></td><td className="p-4"><span className={user.status === 1 ? "text-emerald-300" : "text-rose-300"}>{user.status === 1 ? "正常" : "已禁用"}</span></td><td className="p-4"><div className="flex gap-3"><button onClick={() => setSelected(user)} title="查看用户" className="text-slate-400 hover:text-white"><Eye className="size-4" /></button><button title={user.status === 1 ? "禁用" : "启用"} onClick={() => changeStatus(user)} className="text-amber-300 hover:text-amber-200"><Power className="size-4" /></button><button title="删除用户" onClick={() => remove(user)} className="text-rose-300 hover:text-rose-200"><Trash2 className="size-4" /></button></div></td></tr>)}{users.length === 0 && <tr><td className="p-8 text-center text-slate-500" colSpan={6}>暂无用户</td></tr>}</tbody></table></div>{selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setSelected(null)}><article className="w-full max-w-sm rounded-xl border border-white/[0.12] bg-[#15182a] p-6" onClick={(event) => event.stopPropagation()}><h2 className="text-lg font-semibold">用户详情</h2><dl className="mt-5 space-y-3 text-sm"><div><dt className="text-slate-500">用户 ID</dt><dd>#{selected.id}</dd></div><div><dt className="text-slate-500">用户名</dt><dd>{selected.username}</dd></div><div><dt className="text-slate-500">角色 / 状态</dt><dd>{selected.role} / {selected.status === 1 ? "正常" : "已禁用"}</dd></div><div><dt className="text-slate-500">注册时间</dt><dd>{formatDate(selected.createTime)}</dd></div></dl><button onClick={() => setSelected(null)} className="mt-6 rounded bg-violet-500 px-4 py-2 text-sm">关闭</button></article></div>}</section>;
}
