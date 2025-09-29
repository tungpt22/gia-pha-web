// File: awardsApi.ts
const API_BASE = "http://localhost:3000/api/v1";

/** Luôn trả về object thuần cho headers, tránh union gây lỗi TS */
function makeHeaders(json = false): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  const token = localStorage.getItem("access_token");
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

/* ========= Types ========= */
export type AwardUser = {
  id: string;
  name: string;
  role?: string;
  gender?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  birthday?: string;
  death_day?: string | null;
  profile_img?: string | null;
  created_dt?: string;
  updated_dt?: string;
  deleted_at?: string | null;
};

export type AwardDto = {
  id: string;
  content: string;
  user: AwardUser;
  amount: number | string;
  other_reward?: string | null;
  status?: string; // "Chờ duyệt" | "Đã duyệt" | "Từ Chối"
  award_date?: string; // "YYYY-MM-DD"
  file_attachment?: string | null; // "originalname,uploads/xxx.pdf"
  is_highlight?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type AwardCreateRequest = {
  content: string;
  userId: string;
  amount: number;
  other_reward?: string;
  status: string; // "Chờ duyệt" | "Đã duyệt" | "Từ Chối"
  award_date: string; // "YYYY-MM-DD"
  file_attachment?: string; // "originalname,uploads/xxx.pdf"
  is_highlight?: boolean;
};

export type AwardUpdateRequest = Partial<AwardCreateRequest>; // cho phép update một phần

/* ========= Awards CRUD ========= */
export async function listAwards(params: {
  page: number;
  limit: number;
  search?: string;
}) {
  const url = new URL(`${API_BASE}/awards`);
  url.searchParams.set("page", String(params.page));
  url.searchParams.set("limit", String(params.limit));
  if (params.search != null) url.searchParams.set("search", params.search);

  const res = await fetch(url.toString(), {
    headers: makeHeaders(true),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    message: string;
    data: { data: AwardDto[]; total: number; page: number; limit: number };
  }>;
}

export async function createAward(body: AwardCreateRequest) {
  const res = await fetch(`${API_BASE}/awards`, {
    method: "POST",
    headers: makeHeaders(true),
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateAward(id: string, body: AwardUpdateRequest) {
  const res = await fetch(`${API_BASE}/awards/${id}`, {
    method: "PUT",
    headers: makeHeaders(true),
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteAward(id: string) {
  const res = await fetch(`${API_BASE}/awards/${id}`, {
    method: "DELETE",
    headers: makeHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ========= Users for select ========= */
export type UserLite = { id: string; name: string };

export async function getUsersLite() {
  const res = await fetch(`${API_BASE}/users/find-all-list`, {
    headers: makeHeaders(true),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { message: string; data: UserLite[] };
  return data.data || [];
}

/* ========= Upload file đính kèm ========= */
export type UploadResult = { originalname: string; filename: string }; // filename = "uploads/xxx.pdf"

export async function uploadAttachment(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/Upload`, {
    method: "POST",
    headers: makeHeaders(), // KHÔNG set Content-Type cho FormData
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  const json = (await res.json()) as { message: string; data: UploadResult };
  return json.data;
}

/* ========= Helpers ========= */
export const STATIC_BASE = "http://localhost:3000";

export function parseAttachment(
  value?: string | null
): { name: string; url: string } | null {
  if (!value) return null;
  const idx = value.indexOf(",");
  if (idx === -1) return null;
  const original = value.slice(0, idx).trim();
  const filename = value.slice(idx + 1).trim(); // "uploads/xxx.pdf"
  const url = filename.startsWith("http")
    ? filename
    : `${STATIC_BASE}/${filename.replace(/^\/+/, "")}`;
  return { name: original || "Tài liệu", url };
}
