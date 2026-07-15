import { redirect } from "next/navigation";

/** Keeps legacy bookmarks working while the workspace uses its new public route. */
export default function LegacyHomePage() {
  redirect("/workspace");
}
