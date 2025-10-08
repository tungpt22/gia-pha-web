// changePasswordApi.ts
const API_BASE = "http://localhost:3000/api/v1";

/** Lấy access_token: ưu tiên sessionStorage.userInfo.access_token, fallback localStorage.access_token */
function getToken(): string | null {
  try {
    const s = sessionStorage.getItem("userInfo");
    if (s) {
      const obj = JSON.parse(s);
      if (obj?.access_token) return obj.access_token as string;
    }
  } catch {}
  const t = localStorage.getItem("access_token");
  return t || null;
}

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export type ChangePasswordRequest = {
  oldPassword: string;
  newPassword: string;
};

export async function changePassword(payload: ChangePasswordRequest): Promise<{
  message?: string;
  data?: { message?: string };
}> {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  // Dù thành công hay lỗi, BE đều có thể trả JSON message; ta cố gắng parse
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // không parse được -> tạo message mặc định
    json = { message: res.ok ? "Success" : `Error ${res.status}` };
  }

  if (res.status === 401) {
    throw new Error("Unauthorized: vui lòng đăng nhập lại.");
  }
  if (!res.ok) {
    // Ưu tiên message trong body
    const m =
      json?.data?.message ||
      json?.message ||
      "Đổi mật khẩu thất bại. Vui lòng thử lại.";
    throw new Error(m);
  }
  return json;
}
