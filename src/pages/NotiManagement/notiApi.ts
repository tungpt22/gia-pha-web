// notiApi.ts
const API_BASE = "http://localhost:3000/api/v1";

/** Gắn access_token giống eventsApi */
function authHeaders(): HeadersInit {
  const t = localStorage.getItem("access_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ===== Types ===== */
export type NotiDto = {
  id: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
};

export type NotiCreateRequest = {
  title: string;
  content: string;
};

export type NotiUpdateRequest = {
  title: string;
  content: string;
};

/* ===== API Calls ===== */
export async function listNotifications(
  params: { page?: number; limit?: number } = {}
) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const res = await fetch(
    `${API_BASE}/notifications?page=${page}&limit=${limit}`,
    {
      headers: { ...authHeaders() },
      credentials: "include",
    }
  );
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error(`Failed to list notifications: ${res.status}`);
  return res.json() as Promise<{
    message: string;
    data: { data: NotiDto[]; total: number; page: number; limit: number };
  }>;
}

export async function createNotification(payload: NotiCreateRequest) {
  const res = await fetch(`${API_BASE}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error(`Failed to create notification: ${res.status}`);
  return res.json() as Promise<{ message: string; data: NotiDto }>;
}

export async function updateNotification(
  id: string,
  payload: NotiUpdateRequest
) {
  const res = await fetch(
    `${API_BASE}/notifications/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error(`Failed to update notification: ${res.status}`);
  return res.json() as Promise<{ message: string; data: NotiDto }>;
}

export async function deleteNotification(id: string) {
  const res = await fetch(
    `${API_BASE}/notifications/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { ...authHeaders() },
      credentials: "include",
    }
  );
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error(`Failed to delete notification: ${res.status}`);
  return res.json() as Promise<{ message: string; data?: any }>;
}
