// src/api/usersApi.ts
// Client API cho Users: base URL, Bearer token, CRUD, activities, relationships.

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

/* ----------------------------- Users ------------------------------ */
export type ListResult = {
  items: any[];
  meta: { page: number; limit: number; totalItems: number; totalPages: number };
};

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
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.users)) return res.data.users;
  if (Array.isArray(res?.users)) return res.users;
  if (Array.isArray(res?.rows)) return res.rows;
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

/* ----------------------------- Activities ------------------------------ */
export async function getActivities(userId: string): Promise<
  Array<{
    id: string;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
    position: string | null;
    reward: string | null;
  }>
> {
  const res = await http(`/users/${encodeURIComponent(userId)}/activities`, {
    method: "GET",
  });
  const arr = Array.isArray((res as any)?.data) ? (res as any).data : [];
  return arr.map((x: any) => ({
    id: x.id,
    start_date: x.start_date ?? null,
    end_date: x.end_date ?? null,
    description: x.description ?? null,
    position: x.position ?? null,
    reward: x.reward ?? null,
  }));
}

export async function addActivities(
  userId: string,
  activities: Array<{
    start_date?: string | null;
    end_date?: string | null;
    description?: string | null;
    position?: string | null;
    reward?: string | null;
  }>
): Promise<void> {
  const url = `/users/${encodeURIComponent(userId)}/activities`;
  for (const a of activities) {
    const body = {
      start_date: a.start_date ?? null,
      end_date: a.end_date ?? null,
      description: a.description ?? null,
      position: a.position ?? null,
      reward: a.reward ?? null,
    };
    await http(url, { method: "POST", body: JSON.stringify(body) });
  }
}

export async function deleteActivities(activityIds: string[]): Promise<void> {
  for (const activityId of activityIds) {
    await http(`/users/${encodeURIComponent(activityId)}/activities`, {
      method: "DELETE",
    });
  }
}

/* ----------------------------- Relationships ------------------------------ */
export type RelationshipRecord = {
  id: string;
  relation_type: string; // "Con" | "Vợ" | "Chồng" | ...
  from_user: any;
  to_user: any;
};

export async function getUserRelationships(
  userId: string
): Promise<RelationshipRecord[]> {
  const res = await http(`/users/${encodeURIComponent(userId)}/relationships`, {
    method: "GET",
  });
  return Array.isArray((res as any)?.data) ? (res as any).data : [];
}

export async function addRelationship(
  userId: string,
  toUserId: string,
  relationType: string
): Promise<void> {
  const body = { toUserId, relationType };
  await http(`/users/${encodeURIComponent(userId)}/relationships`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteRelationship(
  fromUserId: string,
  toUserId: string
): Promise<void> {
  await http(
    `/users/${encodeURIComponent(
      fromUserId
    )}/relationships/${encodeURIComponent(toUserId)}`,
    {
      method: "DELETE",
    }
  );
}

export type UserOption = {
  id: string;
  name: string;
  gender?: string;
  birthday?: string | null;
  death_day?: string | null;
  phone_number?: string | null;
};

export type UserDetail = {
  id: string;
  name: string;
  role?: string | null;
  gender?: string | null;
  email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  birthday?: string | null;
  death_day?: string | null;
  profile_img?: string | null;
  created_dt?: string | null;
  updated_dt?: string | null;
  deleted_at?: string | null;
};

export async function listNotChildUsers(): Promise<UserOption[]> {
  const res = await http(`/users/relationships/notChild`, { method: "GET" });
  const arr = Array.isArray((res as any)?.data) ? (res as any).data : [];
  return arr.map((x: any) => ({
    id: x.id,
    name: x.name,
    gender: x.gender,
    birthday: x.birthday ?? null,
    death_day: x.death_day ?? null,
    phone_number: x.phone_number ?? null,
  }));
}
export async function listNotWifeUsers(): Promise<UserOption[]> {
  const res = await http(`/users/relationships/notWife`, { method: "GET" });
  const arr = Array.isArray((res as any)?.data) ? (res as any).data : [];
  return arr.map((x: any) => ({
    id: x.id,
    name: x.name,
    gender: x.gender,
    birthday: x.birthday ?? null,
    death_day: x.death_day ?? null,
    phone_number: x.phone_number ?? null,
  }));
}
export async function listNotHusbandUsers(): Promise<UserOption[]> {
  const res = await http(`/users/relationships/notHusband`, { method: "GET" });
  const arr = Array.isArray((res as any)?.data) ? (res as any).data : [];
  return arr.map((x: any) => ({
    id: x.id,
    name: x.name,
    gender: x.gender,
    birthday: x.birthday ?? null,
    death_day: x.death_day ?? null,
    phone_number: x.phone_number ?? null,
  }));
}

/* API cũ saveRelationships vẫn giữ để không phá chỗ khác (không dùng ở tab mới) */
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

export async function getUserById(id: string): Promise<UserDetail | null> {
  const res = await http(`/users/${id}`, { method: "GET" });
  const arr = Array.isArray((res as any)?.data) ? (res as any).data : [];
  return arr.map((x: any) => ({
    id: x.id,
    name: x.name,
    gender: x.gender,
    birthday: x.birthday ?? null,
    death_day: x.death_day ?? null,
    phone_number: x.phone_number ?? null,
  }));
}
