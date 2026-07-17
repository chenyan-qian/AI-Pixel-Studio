import { redirect } from "next/navigation";

/** 兼容旧书签入口，当前工作台已切换到新的公开访问路径。 */
export default function LegacyHomePage() {
  redirect("/workspace");
}
