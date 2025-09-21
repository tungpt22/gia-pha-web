// src/lib/http.ts
import { getApiBase } from "../config/api";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

type HttpOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

type TokenGetter = () => string | null;
type RefreshFn = () => Promise<boolean>;
type AuthFailureHandler = (status: number) => void;

let getToken: TokenGetter = () => null;
let refreshFn: RefreshFn = async () => false;
let onAuthFailure: AuthFailureHandler = () => {};

// Dedupe refresh khi nhiều request cùng lúc bị 401…
let refreshing: Promise<boolean> | null = null;

export function configureHttpAuth(opts: {
  getAccessToken: TokenGetter;
  refresh: RefreshFn;
  onAuthFailure?: AuthFailureHandler;
}) {
  getToken = opts.getAccessToken;
  refreshFn = opts.refresh;
  onAuthFailure = opts.onAuthFailure || onAuthFailure;
}

function buildInit(opts: HttpOptions): RequestInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  const token = getToken?.();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const init: RequestInit = {
    method: opts.method || "GET",
    headers,
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  };
  return init;
}

function parseBody(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const AUTH_STATUS = new Set([401, 403, 410, 419, 440, 498, 499]);

export async function http<T = any>(
  path: string,
  opts: HttpOptions = {}
): Promise<T> {
  const url = `${getApiBase()}${path}`;
  let init = buildInit(opts);
  let res = await fetch(url, init);

  if (!res.ok && AUTH_STATUS.has(res.status)) {
    // Thử refresh (đồng bộ hoá để chỉ gọi 1 lần)
    if (!refreshing)
      refreshing = refreshFn().finally(() => (refreshing = null));
    const ok = await refreshing;
    if (ok) {
      // retry đúng 1 lần với token mới
      init = buildInit(opts);
      res = await fetch(url, init);
    }
  }

  const text = await res.text();
  const data = parseBody(text);

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error || data.detail)) ||
      `HTTP ${res.status} ${res.statusText}`;
    if (AUTH_STATUS.has(res.status)) {
      onAuthFailure?.(res.status);
      throw new AuthError(msg, res.status);
    }
    throw new Error(msg);
  }

  return data as T;
}

// Convenience helpers
export const get = <T = any>(p: string, o: HttpOptions = {}) =>
  http<T>(p, { ...o, method: "GET" });
export const post = <T = any>(p: string, b?: any, o: HttpOptions = {}) =>
  http<T>(p, { ...o, method: "POST", body: b });
export const put = <T = any>(p: string, b?: any, o: HttpOptions = {}) =>
  http<T>(p, { ...o, method: "PUT", body: b });
export const patch = <T = any>(p: string, b?: any, o: HttpOptions = {}) =>
  http<T>(p, { ...o, method: "PATCH", body: b });
export const del = <T = any>(p: string, o: HttpOptions = {}) =>
  http<T>(p, { ...o, method: "DELETE" });
