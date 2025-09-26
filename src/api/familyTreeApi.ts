// src/api/familyTreeApi.ts
// API client độc lập. Hỗ trợ Bearer/JWT, đọc token từ localStorage hoặc set runtime.

export type RawPersonRef = {
  id: string;
  name: string;
  relation?: string; // "Vợ" | "Chồng" | "Con" (khi xuất hiện trong spouses/children)
  spouses?: RawPersonRef[];
  children?: RawPersonRef[];
  avatarUrl?: string | null;
  birthYear?: number | string | null;
  deathYear?: number | string | null;
  gender?: string | null;
};

export type RawPerson = RawPersonRef; // backend có thể trả cùng cấu trúc cho "gốc"

export type ApiResponse = {
  message: string;
  data: RawPerson[];
};

// ===== Config =====
let API_BASE = "http://localhost:3000/api/v1";
export function setApiBaseFamily(url: string): void {
  API_BASE = url.replace(/\/+$/, "");
}

// Token runtime override
let overrideToken: string | null = null;
export function setAccessTokenFamily(token: string | null): void {
  overrideToken = token;
}
export function getAccessTokenFamily(): string | null {
  if (overrideToken) return overrideToken;
  try {
    const t =
      typeof window !== "undefined"
        ? window.localStorage?.getItem("access_token")
        : null;
    return t || null;
  } catch {
    return null;
  }
}

// Cho phép đổi format header Authorization (mặc định Bearer)
type AuthFormatter = (token: string) => string;
let authFormatter: AuthFormatter = (t) => `Bearer ${t}`;
export function setAuthFormatterFamily(fn: AuthFormatter): void {
  authFormatter = fn;
}

// Hợp nhất headers; không set Content-Type cho GET để hạn chế preflight
function mergeHeaders(
  method: string,
  token: string | null,
  extra?: HeadersInit
): Headers {
  const headers = new Headers(extra || {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const hasBody = !["GET", "HEAD"].includes(method.toUpperCase());
  if (hasBody && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (token && !headers.has("Authorization"))
    headers.set("Authorization", authFormatter(token));
  return headers;
}

async function http(
  path: string,
  init?: RequestInit & { tokenOverride?: string | null }
): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase();
  const token = init?.tokenOverride ?? getAccessTokenFamily();
  const headers = mergeHeaders(method, token, init?.headers);

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    mode: "cors",
    ...init,
    headers,
  });

  if (res.status === 401) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "401 Unauthorized");
  }
  return res;
}

// ===== Public API =====
export async function fetchFamilyTree(
  tokenOverride?: string | null
): Promise<RawPerson[]> {
  const res = await http(`/users/all-family-tree`, {
    method: "GET",
    tokenOverride,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  const body = (await res.json()) as ApiResponse;
  return body?.data ?? [];
}

// (tuỳ chọn) debug console: window.testFamilyTreeCall("<JWT>")
export function installFamilyTreeDebug(): void {
  if (typeof window === "undefined") return;
  (window as any).testFamilyTreeCall = async (token?: string) => {
    try {
      const data = await fetchFamilyTree(token ?? null);
      console.log("FamilyTree OK, length:", data?.length, data);
    } catch (e) {
      console.error("FamilyTree ERR:", e);
    }
  };
}
