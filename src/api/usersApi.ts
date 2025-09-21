// src/api/usersApi.ts
// Client API cho Users: base URL, Bearer token, CRUD, activities, relationships, phân trang server-side.

let API_BASE = "http://localhost:3000/api/v1";

export function setApiBase(url: string) {
  API_BASE = url.replace(/\/+$/, "");
}

let overrideToken: string | null = null;
export function setAccessToken(token: string | null) {
  overrideToken = token;
}
export function getAccessToken(): string | null {
  if (overrideToken) return overrideToken;
  try {
    const raw = sessionStorage.getItem("userInfo");
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj?.access_token || obj?.token || null;
  } catch {
    return null;
  }
}

async function http(path: string, init: RequestInit = {}) {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as any) },
  });

  if (res.status === 401) {
    const next = encodeURIComponent(location.pathname + location.search);
    location.assign(`/login?next=${next}`);
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

/* ------------------------- Chuẩn hoá LIST ------------------------- */
export type ListResult = {
  items: any[];
  meta: { page: number; limit: number; totalItems: number; totalPages: number };
};

// đào mảng items sâu tối đa 5 cấp
function deepFindArrayOfObjects(
  input: any,
  depth = 0,
  maxDepth = 5
): any[] | null {
  if (depth > maxDepth || !input) return null;
  if (Array.isArray(input)) {
    const arr = input as any[];
    if (arr.length === 0) return arr;
    if (arr.every((x) => typeof x === "object" && x != null)) return arr;
    return null;
  }
  if (typeof input !== "object") return null;
  for (const v of Object.values(input)) {
    const got = deepFindArrayOfObjects(v, depth + 1, maxDepth);
    if (got) return got;
  }
  return null;
}

function extractItems(res: any): any[] {
  // PHỔ BIẾN
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.items)) return res.items;

  // Dạng BE trả top-level meta (total/page/limit/totalPages) + data là mảng
  if (Array.isArray(res?.data)) return res.data;

  // Một số biến thể khác
  if (Array.isArray(res?.data?.users)) return res.data.users;
  if (Array.isArray(res?.users)) return res.users;
  if (Array.isArray(res?.rows)) return res.rows;

  // fallback: đào sâu
  const deep = deepFindArrayOfObjects(res);
  return deep || [];
}

function toPosInt(n: any, def: number) {
  const x = Number(n);
  return Number.isFinite(x) && x > 0 ? Math.trunc(x) : def;
}
function toNonNegInt(n: any, def: number) {
  const x = Number(n);
  return Number.isFinite(x) && x >= 0 ? Math.trunc(x) : def;
}

function normalizeListResponse(res: any): ListResult {
  // Ưu tiên đọc meta ở top-level (trường hợp BE trả: message, data:[], total, page, limit, totalPages)
  const pageTop =
    res?.page ?? res?.data?.page ?? res?.meta?.page ?? res?.data?.meta?.page;
  const limitTop =
    res?.limit ??
    res?.data?.limit ??
    res?.meta?.limit ??
    res?.data?.meta?.limit;
  const totalTop =
    res?.total ??
    res?.totalItems ??
    res?.data?.total ??
    res?.data?.totalItems ??
    res?.meta?.total ??
    res?.data?.meta?.total;
  const totalPagesTop =
    res?.totalPages ??
    res?.data?.totalPages ??
    res?.meta?.totalPages ??
    res?.data?.meta?.totalPages;

  const items = extractItems(res);

  const limit = toPosInt(limitTop, 10);
  const totalItems = toNonNegInt(
    totalTop,
    Array.isArray(items) ? items.length : 0
  );
  const totalPages = toPosInt(
    totalPagesTop,
    Math.max(1, Math.ceil((totalItems || 0) / (limit || 10)))
  );
  const page = Math.min(toPosInt(pageTop, 1), totalPages || 1);

  return { items, meta: { page, limit, totalItems, totalPages } };
}

/* ----------------------------- Users ------------------------------ */
export async function listUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ListResult> {
  const p = new URLSearchParams();
  if (params?.page != null) p.set("page", String(params.page));
  if (params?.limit != null) p.set("limit", String(params.limit));
  if (params?.search) p.set("search", params.search);
  const qs = p.toString() ? `?${p.toString()}` : "";
  const res = await http(`/users${qs}`, { method: "GET" });
  return normalizeListResponse(res);
}

export async function createUser(payload: any): Promise<any> {
  return http(`/users`, { method: "POST", body: JSON.stringify(payload) });
}
export async function updateUser(id: string, payload: any): Promise<any> {
  return http(`/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
export async function deleteUser(id: string): Promise<void> {
  await http(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * Lưu "quá trình hoạt động" theo đặc tả:
 * POST localhost:3000/api/v1/users/:id/activities
 * body mẫu: {
 *   "start_date": "2020-01-10",
 *   "end_date": "2020-01-10",
 *   "description": "Tốt nghiệp thạc sĩ",
 *   "position": "Giám đốc",
 *   "reward": "Giám đốc của năm"
 * }
 *
 * Hàm này nhận mảng hoạt động (nhiều dòng) và gọi tuần tự từng request.
 * Bỏ qua dòng trống (không có dữ liệu nào đáng kể).
 */
export async function saveActivities(
  id: string,
  activities: Array<{
    start_date?: string;
    end_date?: string;
    description?: string;
    position?: string;
    reward?: string;
  }>
): Promise<void> {
  const url = `/users/${encodeURIComponent(id)}/activities`;
  const payloads = (activities || []).filter((a) => {
    const hasText =
      (a.description && a.description.trim().length > 0) ||
      (a.position && a.position.trim().length > 0) ||
      (a.reward && a.reward.trim().length > 0);
    const hasDate =
      (a.start_date && a.start_date !== "") ||
      (a.end_date && a.end_date !== "");
    return hasText || hasDate;
  });

  for (const a of payloads) {
    const body = {
      start_date: a.start_date || null,
      end_date: a.end_date || null,
      description: a.description || null,
      position: a.position || null,
      reward: a.reward || null,
    };
    await http(url, { method: "POST", body: JSON.stringify(body) });
  }
}

/**
 * POST /users/relationships/{id}  body: { father, mother, spouse, children[] }
 */
export async function saveRelationships(
  id: string,
  relationships: {
    father?: string | null;
    mother?: string | null;
    spouse?: string | null;
    children?: string[];
  }
): Promise<any> {
  const body = {
    father: relationships.father ?? null,
    mother: relationships.mother ?? null,
    spouse: relationships.spouse ?? null,
    children: relationships.children ?? [],
  };
  return http(`/users/relationships/${encodeURIComponent(id)}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
