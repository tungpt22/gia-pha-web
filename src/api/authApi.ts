// src/api/authApi.ts
// Quản lý login/logout, lưu session và phát sự kiện thay đổi trạng thái đăng nhập.

let API_BASE = "http://localhost:3000/api/v1";
export function setAuthApiBase(url: string) {
  API_BASE = url.replace(/\/+$/, "");
}

/** Kiểu dữ liệu user info lưu trong session */
export type UserInfo = { access_token: string; user: any };

/** Sự kiện để UI cập nhật ngay khi login/logout */
export const AUTH_CHANGED_EVENT = "auth-changed";
function emitAuthChanged(info: UserInfo | null) {
  try {
    document.dispatchEvent(
      new CustomEvent(AUTH_CHANGED_EVENT, { detail: info })
    );
  } catch {}
}

/** Session helpers */
export function saveUserInfo(info: UserInfo) {
  sessionStorage.setItem("userInfo", JSON.stringify(info));
  emitAuthChanged(info);
}
export function loadUserInfo(): UserInfo | null {
  try {
    const raw = sessionStorage.getItem("userInfo");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function clearUserInfo() {
  sessionStorage.removeItem("userInfo");
  emitAuthChanged(null);
}
export function getAccessToken(): string | null {
  return loadUserInfo()?.access_token ?? null;
}
export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

/** HTTP helper: tự gắn Bearer nếu có token */
async function http(path: string, init: RequestInit = {}) {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as any) },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

/** ✅ Login: body luôn { phone_number, password } */
export async function login(
  phone_number: string,
  password: string
): Promise<UserInfo> {
  const data = await http(`/auth/login`, {
    method: "POST",
    body: JSON.stringify({ phone_number, password }),
  });

  const info: UserInfo = {
    access_token: data?.data?.access_token ?? data?.access_token,
    user: data?.data?.user ?? data?.user,
  };
  saveUserInfo(info);
  return info;
}

/** ✅ Logout: gọi API rồi dọn session (dù API có lỗi) */
export async function logout(): Promise<void> {
  const token = getAccessToken();
  try {
    await http(`/auth/logout`, {
      method: "POST",
      body: JSON.stringify({ access_token: token ?? "" }),
    });
  } catch {
    // bỏ qua lỗi mạng/hết hạn token
  } finally {
    clearUserInfo(); // phát AUTH_CHANGED_EVENT
  }
}
