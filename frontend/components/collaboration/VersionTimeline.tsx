"use client";

import { History } from "lucide-react";

export interface ArtworkVersion {
  id?: number;
  versionNumber: number;
  description: string;
  creatorId: number;
  createTime: string;
  key: string;
}

export default function VersionTimeline({ versions, onRestore }: { versions: ArtworkVersion[]; onRestore: (version: ArtworkVersion) => void }) {
  return <section className="border-t border-white/[0.1] pt-4">
    <div className="flex items-center gap-2 text-xs font-medium text-zinc-300"><History className="size-4 text-cyan-300" />版本时间线</div>
    <div className="mt-3 space-y-2">{versions.slice(0, 5).map((version) => <div key={version.key} className="flex items-center justify-between gap-2 text-xs"><div className="min-w-0"><p className="truncate text-zinc-200">V{version.versionNumber} · {version.description}</p><p className="mt-0.5 text-[10px] text-zinc-500">{new Date(version.createTime).toLocaleString("zh-CN")}</p></div><button type="button" title="恢复此版本" onClick={() => onRestore(version)} className="text-cyan-300 hover:text-cyan-200">恢复</button></div>)}{versions.length === 0 && <p className="text-xs text-zinc-600">尚未创建协作版本</p>}</div>
  </section>;
}
