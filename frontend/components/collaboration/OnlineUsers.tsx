"use client";

import { Users } from "lucide-react";
import type { RenderedCollaborationUser } from "@/lib/collaboration";

const USER_COLORS = ["#7c3aed", "#0891b2", "#db2777", "#059669", "#d97706"];

export default function OnlineUsers({ users }: { users: RenderedCollaborationUser[] }) {
  return <div className="flex items-center gap-2 text-xs text-zinc-300" aria-label="在线创作者">
    <Users className="size-4 text-cyan-300" />
    <div className="flex -space-x-1.5">{users.slice(0, 5).map((user, position) => <span key={user.key} title={user.username} className="grid size-6 place-items-center rounded-full border border-[#101119] text-[10px] font-semibold text-white" style={{ backgroundColor: USER_COLORS[position] }}>{user.username.charAt(0).toUpperCase()}</span>)}</div>
    <span>{users.length ? `${users.length} 人正在创作` : "正在连接"}</span>
  </div>;
}
