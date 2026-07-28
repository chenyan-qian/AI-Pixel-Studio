"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { SettingsCenter } from "@/components/settings/SettingsCenter";
import { type AuthUser, clearSession, getToken, getUser } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

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

  if (!checkedAuth || !user) return <main className="theme-page grid min-h-screen place-items-center text-sm"><p className="theme-text-tertiary">正在验证登录状态...</p></main>;

  return <main className="theme-page grid-background min-h-screen px-4 pb-14 pt-24 sm:px-7"><Navbar /><SettingsCenter user={user} /></main>;
}
