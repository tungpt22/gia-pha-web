// src/config/api.ts
// Cấu hình API base dùng chung

function normalizeBase(input: string): string {
  const s = (input || "").replace(/\/+$/, "");
  try {
    const u = new URL(/^https?:\/\//.test(s) ? s : `http://${s}`);
    if (u.port === "8080") u.port = "3000"; // Dev backend của bạn chạy 3000
    return u.toString().replace(/\/+$/, "");
  } catch {
    return s;
  }
}

let RAW =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_API_BASE) ||
  (typeof process !== "undefined" &&
    (process as any).env?.NEXT_PUBLIC_API_BASE) ||
  "http://localhost:3000/api/v1";

let API_BASE = normalizeBase(RAW);

export function setApiBase(v: string) {
  API_BASE = normalizeBase(v);
}
export function getApiBase() {
  return API_BASE;
}
