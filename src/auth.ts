// src/auth.ts
export type AuthUser = { name: string; avatar?: string };
export type AuthState = { token: string; user: AuthUser };

const KEY = "auth";

export function getAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

export function setAuth(state: AuthState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}

export function isLoggedIn() {
  return !!getAuth();
}
