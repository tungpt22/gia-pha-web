// src/auth/tokenStore.ts
let accessToken: string | null = null;

// (tuỳ chọn) khôi phục từ localStorage để survive reload
const KEY = "access_token";
if (typeof localStorage !== "undefined") {
  accessToken = localStorage.getItem(KEY);
}

export function setAccessToken(t: string | null) {
  accessToken = t;
  if (typeof localStorage !== "undefined") {
    if (t) localStorage.setItem(KEY, t);
    else localStorage.removeItem(KEY);
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearTokens() {
  setAccessToken(null);
}
