// newsApi.ts
const API_BASE = "http://localhost:3000/api/v1";

function authHeaders(): HeadersInit {
  const t = localStorage.getItem("access_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export type NewsPayload = {
  title: string;
  content: string;
  thumbnail?: string | null;
  is_publish: boolean;
};

export async function listNews(page = 1, limit = 10, search = "") {
  const res = await fetch(
    `${API_BASE}/news?page=${page}&limit=${limit}&search=${encodeURIComponent(
      search
    )}`,
    { headers: { ...authHeaders() }, credentials: "include" }
  );
  if (!res.ok) throw new Error("Failed to fetch news");
  return res.json();
}

export async function getNews(id: string) {
  const res = await fetch(`${API_BASE}/news/${id}`, {
    headers: { ...authHeaders() },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to get news");
  return res.json();
}

export async function createNews(payload: NewsPayload) {
  const res = await fetch(`${API_BASE}/news`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create news");
  return res.json();
}

export async function updateNews(id: string, payload: NewsPayload) {
  const res = await fetch(`${API_BASE}/news/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update news");
  return res.json();
}

export async function deleteNews(id: string) {
  const res = await fetch(`${API_BASE}/news/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete news");
  return res.json();
}

export async function bulkPatch(
  ids: string[],
  patch: Partial<Pick<NewsPayload, "is_publish">>
) {
  for (const id of ids) {
    const current = await getNews(id);
    await updateNews(id, { ...(current?.data || {}), ...patch } as NewsPayload);
  }
  return { message: "Success" };
}

export async function uploadFile(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/Upload`, {
    method: "POST",
    body: fd,
    headers: { ...authHeaders() },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to upload");
  return res.json() as Promise<{
    message: string;
    data: { originalname: string; filename: string };
  }>;
}

// newsApi.ts
export async function fetchNewsPageHtml(id: string): Promise<string> {
  const t = localStorage.getItem("access_token");
  const headers: HeadersInit = t
    ? { Authorization: `Bearer ${t}`, Accept: "text/html, */*;q=0.8" }
    : { Accept: "text/html, */*;q=0.8" };

  const res = await fetch(`${API_BASE}/news/pages/${encodeURIComponent(id)}`, {
    headers,
    credentials: "include",
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error(`Failed to fetch news page: ${res.status}`);

  // QUAN TRỌNG: phải return text() -> Promise<string>
  return await res.text();
}
