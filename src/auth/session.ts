// src/auth/session.ts

export type BackendUser = {
  id: string;
  name: string;
  role: string;
  gender?: string | null;
  email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  birthday?: string | null;
  death_day?: string | null;
  profile_img?: string | null;
  created_dt?: string;
  updated_dt?: string;
  deleted_at?: string | null;
};

export type UserInfo = {
  access_token: string;
  user: BackendUser;
};

const KEY = "userInfo";

/** Helpers an toàn – không throw khi storage bị chặn */
function safeSet(storage: Storage | undefined, k: string, v: string) {
  try {
    storage?.setItem(k, v);
  } catch {}
}
function safeGet(storage: Storage | undefined, k: string): string | null {
  try {
    return storage?.getItem(k) ?? null;
  } catch {
    return null;
  }
}
function safeRemove(storage: Storage | undefined, k: string) {
  try {
    storage?.removeItem(k);
  } catch {}
}

/** Lưu vào sessionStorage (mặc định) */
export function saveSessionUserInfo(info: UserInfo) {
  safeSet(window?.sessionStorage, KEY, JSON.stringify(info));
}
/** Lưu vào localStorage (để “ghi nhớ” sau khi đóng tab) */
export function saveLocalUserInfo(info: UserInfo) {
  safeSet(window?.localStorage, KEY, JSON.stringify(info));
}
/** API tiện dụng: luôn lưu session; nếu remember=true thì lưu thêm local */
export function persistUserInfo(info: UserInfo, remember: boolean) {
  saveSessionUserInfo(info);
  if (remember) saveLocalUserInfo(info);
  else safeRemove(window?.localStorage, KEY);
}

export function loadSessionUserInfo(): UserInfo | null {
  const raw = safeGet(window?.sessionStorage, KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    safeRemove(window?.sessionStorage, KEY);
    return null;
  }
}
export function loadLocalUserInfo(): UserInfo | null {
  const raw = safeGet(window?.localStorage, KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    safeRemove(window?.localStorage, KEY);
    return null;
  }
}

/** Ưu tiên session → nếu không có thì lấy ở local rồi **sync lại** vào session */
export function loadUserInfoAnywhere(): UserInfo | null {
  const s = loadSessionUserInfo();
  if (s) return s;
  const l = loadLocalUserInfo();
  if (l) {
    saveSessionUserInfo(l);
    return l;
  }
  return null;
}

/** Xoá cả session + local (không đụng savedPhone/savedPassword) */
export function clearUserInfo() {
  safeRemove(window?.sessionStorage, KEY);
  safeRemove(window?.localStorage, KEY);
}
