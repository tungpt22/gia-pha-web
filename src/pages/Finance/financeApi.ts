// File: financeApi.ts
// API Thu/Chi (Finances)
// - Truyền access_token tương tự familyTreeApi.ts / albumsApi.ts
// - Các hàm: list, create, update, remove, detail

export type FinanceDto = {
  id: string;
  type: "Thu" | "Chi";
  amount: number | string; // API đôi khi trả về chuỗi "100000.00"
  finance_date: string; // YYYY-MM-DD
  description: string | null;
  created_dt: string;
  updated_dt: string;
  deleted_at: string | null;
};

export type FinanceListResponse = {
  message: string;
  data: {
    data: FinanceDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type FinanceCreateRequest = {
  type: "Thu" | "Chi";
  finance_date: string; // YYYY-MM-DD
  amount: number; // VND
  description?: string;
};

export type FinanceUpdateRequest = FinanceCreateRequest;

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

function toQueryString(params: Record<string, string | number | undefined>) {
  const parts: string[] = [];
  for (const k of Object.keys(params)) {
    const v = params[k];
    if (v !== undefined && v !== null && v !== "") {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.join("&");
}

/** Danh sách có phân trang & filter */
export async function listFinances(params: {
  page?: number;
  limit?: number;
  search?: string; // chỉ search theo "tên khoản" (mình map = description)
  type?: "" | "Thu" | "Chi";
  access_token?: string;
}): Promise<FinanceListResponse> {
  const {
    page = 1,
    limit = 10,
    search = "",
    type = "",
    access_token,
  } = params || {};
  const qs = toQueryString({ page, limit, search, type });
  const res = await fetch(`${API_BASE}/finances?${qs}`, {
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

/** Thêm khoản Thu/Chi */
export async function createFinance(
  body: FinanceCreateRequest,
  access_token?: string
) {
  const res = await fetch(`${API_BASE}/finances`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(access_token),
    },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ message: string; data: FinanceDto }>;
}

/** Sửa khoản Thu/Chi */
export async function updateFinance(
  id: string,
  body: FinanceUpdateRequest,
  access_token?: string
) {
  const res = await fetch(`${API_BASE}/finances/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(access_token),
    },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ message: string; data: FinanceDto }>;
}

/** Xoá khoản Thu/Chi */
export async function deleteFinance(id: string, access_token?: string) {
  const res = await fetch(`${API_BASE}/finances/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders(access_token) },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ message: "Success" }>;
}

/** Xem chi tiết khoản Thu/Chi */
export async function getFinance(id: string, access_token?: string) {
  const res = await fetch(`${API_BASE}/finances/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(access_token),
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ message: string; data: FinanceDto }>;
}

export async function exportFinancesExcel(params: {
  search?: string;
  type?: "" | "Thu" | "Chi";
}) {
  const url = new URL(`${API_BASE}/finances/export`);
  url.searchParams.set("search", params.search || "");
  if (params.type) url.searchParams.set("type", params.type);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { ...authHeaders() },
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.blob(); // .xlsx
}

const financeApi = {
  listFinances,
  createFinance,
  updateFinance,
  deleteFinance,
  getFinance,
};
export default financeApi;
