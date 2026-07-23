export interface AuthUser {
  username: string;
  nickname: string;
  avatar?: string | null;
  role?: "USER" | "ADMIN";
}

const TOKEN_KEY = "ai-pixel-token";
const USER_KEY = "ai-pixel-user";

export function saveSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() { return localStorage.getItem(TOKEN_KEY); }

/** 只有本地同时存在 token 和用户信息时，才视为前端登录态有效。 */
export function isAuthenticated() {
  return Boolean(getToken() && getUser());
}

export function getUser(): AuthUser | null {
  const value = localStorage.getItem(USER_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as AuthUser; } catch { clearSession(); return null; }
}

export function isAdmin() { return getUser()?.role === "ADMIN"; }

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
