export interface AuthUser {
  id: number;
  username: string;
  nickname: string;
  avatar?: string | null;
  role?: "USER" | "ADMIN";
}

const TOKEN_KEY = "ai-pixel-token";
const USER_KEY = "ai-pixel-user";

export function saveSession(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.removeItem(USER_KEY);
}

function saveUser(user: AuthUser) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  try {
    const savedSettings = JSON.parse(localStorage.getItem(`pixelverse-user-settings:${user.username}`) || "{}");
    if (savedSettings.theme === "dark" || savedSettings.theme === "light" || savedSettings.theme === "system") {
      localStorage.setItem("theme", savedSettings.theme);
    }
  } catch {
    // A corrupt settings entry must not interrupt a successful login.
  }
  window.dispatchEvent(new Event("pixelverse-theme-change"));
}

export function getToken() { return typeof window === "undefined" ? null : sessionStorage.getItem(TOKEN_KEY); }

/** 只有本地同时存在 token 和用户信息时，才视为前端登录态有效。 */
export function isAuthenticated() {
  return Boolean(getToken() && getUser());
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(USER_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as AuthUser; } catch { clearSession(); return null; }
}

export function isAdmin() { return getUser()?.role === "ADMIN"; }

export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

/** Revalidates this browser tab's token and never trusts cached profile data. */
export async function refreshSession(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}/api/user/info`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json() as { code?: number; data?: AuthUser };
    if (!response.ok || payload.code !== 200 || !payload.data) throw new Error("Session is invalid");
    saveUser(payload.data);
    return payload.data;
  } catch {
    clearSession();
    return null;
  }
}
