// File: albumsApi.ts
// API Albums & Photos
// - Lấy access_token tương tự familyTreeApi.ts (đọc từ localStorage hoặc truyền vào).
// - Không dùng DOM types để tránh lỗi TS ở môi trường không có "dom" lib.

export type AlbumDto = {
  id: string;
  name: string;
  description: string | null;
  created_dt: string;
  updated_dt: string;
  deleted_at: string | null;
};

export type AlbumsListResponse = {
  message: string;
  data: {
    data: AlbumDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type CreateAlbumRequest = { name: string; description?: string };
export type UpdateAlbumRequest = { name: string; description?: string };

export type PhotoDto = {
  id: string;
  name: string;
  description: string | null;
  url: string;
  created_dt: string;
  updated_dt: string;
};

export type PhotosListResponse = {
  message: string;
  data: {
    message: string;
    data: PhotoDto[];
  };
};

export type PhotoUpsertResponse = {
  message: string;
  data: {
    message: string;
    data: PhotoDto;
  };
};

export type SimpleSuccess = { message: string };

const API_BASE = "http://localhost:3000/api/v1";

// Lấy token: ưu tiên token truyền vào, fallback localStorage("access_token")
function getAccessToken(passed?: string): string {
  if (passed) return passed;
  try {
    return localStorage.getItem("access_token") || "";
  } catch {
    return "";
  }
}

function authHeaders(token?: string): Record<string, string> {
  const t = getAccessToken(token);
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function toQueryString(
  params: Record<string, string | number | undefined>
): string {
  const parts: string[] = [];
  for (const k of Object.keys(params)) {
    const v = params[k];
    if (v !== undefined && v !== null) {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.join("&");
}

// ===== Albums =====
export async function listAlbums(params: {
  page?: number;
  limit?: number;
  search?: string;
  access_token?: string;
}): Promise<AlbumsListResponse> {
  const { page = 1, limit = 10, search = "", access_token } = params || {};
  const qs = toQueryString({ page, limit, search });
  const res = await fetch(`${API_BASE}/albums?${qs}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(access_token),
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createAlbum(
  req: CreateAlbumRequest,
  access_token?: string
) {
  const res = await fetch(`${API_BASE}/albums`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(access_token),
    },
    body: JSON.stringify(req),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ message: string; data: AlbumDto }>;
}

export async function updateAlbum(
  id: string,
  req: UpdateAlbumRequest,
  access_token?: string
) {
  const res = await fetch(`${API_BASE}/albums/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(access_token),
    },
    body: JSON.stringify(req),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ message: string; data: AlbumDto }>;
}

export async function deleteAlbum(id: string, access_token?: string) {
  const res = await fetch(`${API_BASE}/albums/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders(access_token) },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<SimpleSuccess>;
}

// ===== Photos =====
export async function listPhotos(albumId: string, access_token?: string) {
  const res = await fetch(`${API_BASE}/albums/${albumId}/photos/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(access_token),
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<PhotosListResponse>;
}

export async function uploadPhotos(
  albumId: string,
  files: File[],
  name?: string,
  access_token?: string
) {
  const form = new FormData();
  for (const f of files) form.append("file", f);
  if (name) form.append("name", name);

  const res = await fetch(`${API_BASE}/albums/${albumId}/upload`, {
    method: "POST",
    headers: { ...authHeaders(access_token) },
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<PhotoUpsertResponse>;
}

export async function updatePhoto(
  albumId: string,
  photoId: string,
  payload: { name?: string; description?: string },
  access_token?: string
) {
  const res = await fetch(`${API_BASE}/albums/${albumId}/photos/${photoId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(access_token),
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<PhotoUpsertResponse>;
}

export async function deletePhoto(
  albumId: string,
  photoId: string,
  access_token?: string
) {
  const res = await fetch(`${API_BASE}/albums/${albumId}/photos/${photoId}`, {
    method: "DELETE",
    headers: { ...authHeaders(access_token) },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ message: string; data?: { message: string } }>;
}

// Tuỳ chọn: default export cho tiện import
const albumsApi = {
  listAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  listPhotos,
  uploadPhotos,
  updatePhoto,
  deletePhoto,
};
export default albumsApi;
