// File: eventsApi.ts
const API_BASE = "http://localhost:3000/api/v1";

export type EventDto = {
  id: string;
  name: string;
  event_date: string; // yyyy-mm-dd
  location?: string | null;
  description?: string | null;
  created_dt?: string;
  updated_dt?: string;
  deleted_at?: string | null;
};

export type EventCreateRequest = {
  name: string;
  event_date: string;
  location?: string;
  description?: string;
};

export type EventUpdateRequest = EventCreateRequest;

type ListResponse = {
  message: string;
  data: {
    data: EventDto[];
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };
};

type DetailResponse = {
  message: string;
  data: EventDto;
};

type SimpleResponse = { message: string };

function makeHeaders(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = localStorage.getItem("access_token");
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    return res.text().then((t) => {
      throw new Error(t || `HTTP ${res.status}`);
    });
  }
  return res.json() as Promise<T>;
}

export async function listEvents(
  params: { page?: number; limit?: number; search?: string } = {}
) {
  const { page = 1, limit = 10, search = "" } = params;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (search) qs.set("search", search);

  const res = await fetch(
    `${API_BASE}/events${qs.toString() ? `?${qs.toString()}` : ""}`,
    {
      method: "GET",
      headers: makeHeaders(),
      credentials: "include",
    }
  );
  return handleJson<ListResponse>(res);
}

export async function getEvent(id: string) {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: "GET",
    headers: makeHeaders(),
    credentials: "include",
  });
  return handleJson<DetailResponse>(res);
}

export async function createEvent(payload: EventCreateRequest) {
  const res = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: makeHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleJson<DetailResponse>(res);
}

export async function updateEvent(id: string, payload: EventUpdateRequest) {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: "PUT",
    headers: makeHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleJson<DetailResponse>(res);
}

export async function deleteEvent(id: string) {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: "DELETE",
    headers: makeHeaders(),
    credentials: "include",
  });
  return handleJson<SimpleResponse>(res);
}
