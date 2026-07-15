export interface AuthUser {
  username: string;
  nickname: string;
  avatar?: string | null;
}

const TOKEN_KEY = "ai-pixel-token";
const USER_KEY = "ai-pixel-user";

export function saveSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() { return localStorage.getItem(TOKEN_KEY); }

/** A session is valid for client-side navigation only when both saved values exist. */
export function isAuthenticated() {
  return Boolean(getToken() && getUser());
}

export function getUser(): AuthUser | null {
  const value = localStorage.getItem(USER_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as AuthUser; } catch { clearSession(); return null; }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
