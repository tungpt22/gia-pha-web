// File: newsApi.ts
const API_BASE = "http://localhost:3000/api/v1";
const FILE_BASE = "http://localhost:3000";

/** =================== Types =================== */
export type NewsDto = {
  id: string;
  title: string;
  content: string; // HTML
  thumbnail?: string | null; // lưu filename (vd: abc.jpg hoặc uploads/abc.jpg)
  is_publish: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type NewsCreateRequest = {
  title: string;
  content: string; // HTML
  thumbnail?: string | null; // filename
  is_publish: boolean;
};

export type NewsUpdateRequest = NewsCreateRequest;

type ListResponse = {
  message: string;
  data: {
    data: NewsDto[];
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };
};

type DetailResponse = {
  message: string;
  data: NewsDto;
};

type SimpleResponse = { message: string };

export type UploadResponse = {
  message: "Success";
  data: { originalname: string; filename: string }; // filename: tên tệp đã lưu trên server
};

/** =================== Helpers =================== */
function makeHeaders(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = localStorage.getItem("access_token");
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}
function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok)
    return res.text().then((t) => {
      throw new Error(t || `HTTP ${res.status}`);
    });
  return res.json() as Promise<T>;
}

/** Dùng cho ảnh chèn trong nội dung (giữ như cũ) */
export function toAbsoluteFileUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${FILE_BASE}${p}`;
}

/** Dùng riêng cho thumbnail theo yêu cầu: http://localhost:3000/uploads/{thumbnail}
 * - Nếu thumbnail là URL tuyệt đối -> giữ nguyên
 * - Nếu thumbnail đã bắt đầu bằng "uploads/" -> http://localhost:3000/{thumbnail}
 * - Còn lại -> http://localhost:3000/uploads/{thumbnail}
 */
export function toAbsoluteThumbUrl(thumbnail?: string | null): string | null {
  if (!thumbnail) return null;
  if (/^https?:\/\//i.test(thumbnail)) return thumbnail;
  if (thumbnail.startsWith("uploads/")) return `${FILE_BASE}/${thumbnail}`;
  return `${FILE_BASE}/uploads/${thumbnail}`;
}

/** =================== News APIs =================== */
export async function listNews(
  params: { page?: number; limit?: number; search?: string } = {}
) {
  const { page = 1, limit = 10, search = "" } = params;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (search) qs.set("search", search);

  const res = await fetch(
    `${API_BASE}/news${qs.toString() ? `?${qs.toString()}` : ""}`,
    {
      method: "GET",
      headers: makeHeaders(),
      credentials: "include",
    }
  );
  return handleJson<ListResponse>(res);
}

export async function getNews(id: string) {
  const res = await fetch(`${API_BASE}/news/${id}`, {
    method: "GET",
    headers: makeHeaders(),
    credentials: "include",
  });
  return handleJson<DetailResponse>(res);
}

export async function createNews(payload: NewsCreateRequest) {
  const res = await fetch(`${API_BASE}/news`, {
    method: "POST",
    headers: makeHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleJson<DetailResponse>(res);
}

export async function updateNews(id: string, payload: NewsUpdateRequest) {
  const res = await fetch(`${API_BASE}/news/${id}`, {
    method: "PUT",
    headers: makeHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleJson<DetailResponse>(res);
}

export async function deleteNews(id: string) {
  const res = await fetch(`${API_BASE}/news/${id}`, {
    method: "DELETE",
    headers: makeHeaders(),
    credentials: "include",
  });
  return handleJson<SimpleResponse>(res);
}

/** =================== Upload API =================== */
export async function uploadFile(file: File): Promise<UploadResponse["data"]> {
  const form = new FormData();
  form.append("file", file);
  const token = localStorage.getItem("access_token");

  const res = await fetch(`${API_BASE}/Upload`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form, // KHÔNG set Content-Type khi gửi FormData
  });
  if (!res.ok) throw new Error(await res.text());
  const json = (await res.json()) as UploadResponse;
  return json.data;
}
