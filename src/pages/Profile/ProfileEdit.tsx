// ProfileEdit.tsx
import * as React from "react";
import "../Users/Users.css";
import { uploadProfile } from "../Users/usersApi"; // chỉnh path nếu cần

type AuthUser = {
  id: string;
  name: string;
  role?: string;
  gender?: string;
  status?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  birthday?: string | null;
  death_day?: string | null;
  profile_img?: string | null; // LƯU filename (uploads/xxx.jpg)
  created_dt?: string;
  updated_dt?: string;
  deleted_at?: string | null;
};

type SessionUserInfo = {
  access_token: string;
  user: AuthUser;
};

const API_BASE = "http://localhost:3000/api/v1";
const FILE_BASE = "http://localhost:3000";
const SESSION_KEY = "userInfo";

function getSessionAuth(): { token: string; user: AuthUser } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: SessionUserInfo = JSON.parse(raw);
    const token = parsed?.access_token;
    const user = parsed?.user;
    if (!token || !user?.id) return null;
    return { token, user };
  } catch {
    return null;
  }
}
function setSessionAuth(token: string, user: AuthUser) {
  const payload: SessionUserInfo = { access_token: token, user };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}
function toDateOnly(input?: string | null) {
  if (!input) return "";
  return input.length >= 10 ? input.slice(0, 10) : input;
}
function toFileUrl(path?: string | null) {
  if (!path) return null;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${FILE_BASE}${p}`;
}

/** Chuẩn hóa kết quả trả về từ uploadProfile thành { originalname, filename? } */
function normalizeUploadResp(
  resp: unknown,
  fallbackOriginalName: string
): { originalname: string; filename?: string } {
  if (typeof resp === "string") {
    try {
      const j = JSON.parse(resp);
      const original =
        j?.data?.originalname ?? j?.originalname ?? fallbackOriginalName;
      const filename = j?.data?.filename ?? j?.filename ?? undefined;
      return { originalname: original, filename };
    } catch {
      return { originalname: fallbackOriginalName, filename: resp };
    }
  }
  const anyResp = resp as any;
  const original =
    anyResp?.data?.originalname ??
    anyResp?.originalname ??
    fallbackOriginalName;
  const filename = anyResp?.data?.filename ?? anyResp?.filename ?? undefined;
  return { originalname: original, filename };
}

export default function ProfileEdit() {
  const [auth, setAuth] = React.useState<{
    token: string;
    user: AuthUser;
  } | null>(getSessionAuth());
  const [user, setUser] = React.useState<AuthUser | null>(auth?.user ?? null);

  // Ảnh đại diện:
  // - avatarFileNamePath: filename/path để LƯU & PREVIEW (uploads/xxx.jpg)
  // - avatarOriginalName: tên file gốc để hiển thị
  const [avatarFileNamePath, setAvatarFileNamePath] = React.useState<
    string | null
  >(null);
  const [avatarOriginalName, setAvatarOriginalName] = React.useState<
    string | null
  >(null);

  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  // Nếu đã có profile_img (filename) -> hiển thị luôn ô avatar
  React.useEffect(() => {
    if (user?.profile_img) {
      if (!avatarFileNamePath) setAvatarFileNamePath(user.profile_img); // filename/path từ server
      if (!avatarOriginalName) setAvatarOriginalName(user.profile_img); // nếu không có originalname, dùng basename
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profile_img]);

  if (!auth || !user) {
    return (
      <div className="users-wrap">
        <div className="card">
          <div className="page-head">
            <div className="page-title">Cập nhật thông tin</div>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p>Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.</p>
          <div className="actions actions--center">
            <button
              className="button button--primary"
              onClick={() => (window.location.href = "/login")}
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  const setField = <K extends keyof AuthUser>(k: K, v: AuthUser[K]) =>
    setUser((prev) => (prev ? { ...prev, [k]: v } : prev));

  const onPickAvatar = async (file: File) => {
    try {
      const res = await uploadProfile(file);
      const { originalname, filename } = normalizeUploadResp(res, file.name);

      // LƯU filename vào state và user.profile_img
      setAvatarFileNamePath(filename || null);
      setAvatarOriginalName(originalname || null);
      setField("profile_img", filename || null);

      setMsg("Tải ảnh đại diện thành công.");
      setTimeout(() => setMsg(null), 2000);
    } catch (e: any) {
      setMsg(e?.message || "Tải ảnh không thành công.");
      setTimeout(() => setMsg(null), 2500);
    }
  };

  const onSave = async () => {
    if (!auth || !user) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(
        `${API_BASE}/users/${encodeURIComponent(user.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            name: user.name ?? "",
            gender: user.gender ?? "",
            email: user.email ?? "",
            phone_number: user.phone_number ?? "",
            address: user.address ?? "",
            birthday: user.birthday || null,
            death_day: user.death_day || null,
            // LƯU filename (ưu tiên file mới upload, fallback dữ liệu cũ)
            profile_img: avatarFileNamePath || user.profile_img || null,
          }),
        }
      );

      if (res.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        sessionStorage.removeItem(SESSION_KEY);
        setAuth(null);
        setUser(null);
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Cập nhật thất bại");
      }
      const json = await res.json();
      const updated: AuthUser = json?.data ?? user;
      setUser(updated);
      setSessionAuth(auth.token, updated);
      setMsg("Cập nhật thông tin thành công.");
    } catch (e: any) {
      setMsg(e?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 2500);
    }
  };

  const previewUrl = toFileUrl(avatarFileNamePath || user.profile_img);
  const hasAvatarInfo = !!(
    previewUrl ||
    avatarOriginalName ||
    user.profile_img
  );

  // Placeholder initials (khi không có preview)
  const initials =
    (user.name || "")
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AV";

  return (
    <div className="users-wrap">
      <div className="card">
        <div className="page-head">
          <div className="page-title">Cập nhật thông tin</div>
          <div style={{ marginLeft: "auto", opacity: 0.8 }}>
            Xin chào, <b>{user.name}</b>
          </div>
        </div>

        <div className="form form-grid">
          <div className="fi">
            <label>Họ tên</label>
            <div className="control">
              <input
                value={user.name || ""}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>
          </div>

          <div className="fi">
            <label>Giới tính</label>
            <div className="control">
              <select
                value={user.gender || ""}
                onChange={(e) => setField("gender", e.target.value)}
              >
                <option value="">-- Chọn --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
          </div>

          <div className="fi">
            <label>Email</label>
            <div className="control">
              <input
                type="email"
                value={user.email || ""}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>
          </div>

          <div className="fi">
            <label>Số điện thoại</label>
            <div className="control">
              <input
                value={user.phone_number || ""}
                onChange={(e) => setField("phone_number", e.target.value)}
              />
            </div>
          </div>

          <div className="fi" style={{ gridColumn: "1 / -1" }}>
            <label>Địa chỉ</label>
            <div className="control">
              <input
                value={user.address || ""}
                onChange={(e) => setField("address", e.target.value)}
              />
            </div>
          </div>

          <div className="fi">
            <label>Ngày sinh</label>
            <div className="control">
              <input
                type="date"
                value={toDateOnly(user.birthday)}
                onChange={(e) => setField("birthday", e.target.value || null)}
              />
            </div>
          </div>

          <div className="fi">
            <label>Ngày mất</label>
            <div className="control">
              <input
                type="date"
                value={toDateOnly(user.death_day)}
                onChange={(e) => setField("death_day", e.target.value || null)}
              />
            </div>
          </div>

          {/* ẢNH ĐẠI DIỆN */}
          <div className="fi" style={{ gridColumn: "1 / -1" }}>
            <label>Ảnh đại diện</label>
            <div
              className="control"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <label className="button" style={{ cursor: "pointer" }}>
                Chọn ảnh…
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPickAvatar(f);
                  }}
                />
              </label>

              {hasAvatarInfo ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="avatar preview"
                      style={{
                        width: 64,
                        height: 64,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        background: "#f3f4f6",
                        color: "#374151",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                      }}
                      aria-label="avatar placeholder"
                      title={avatarOriginalName ?? user.profile_img ?? ""}
                    >
                      {initials}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: "#374151" }}>
                    {/* Tên file hiển thị: ưu tiên originalname; nếu không có thì basename(filename) */}
                    {avatarOriginalName ?? user.profile_img ?? ""}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  Chưa có ảnh
                </div>
              )}
            </div>
          </div>

          <div
            className="actions actions--center actions--even"
            style={{ gridColumn: "1 / -1" }}
          >
            <button
              className="button button--primary"
              onClick={onSave}
              disabled={busy}
            >
              {busy ? "Đang lưu..." : "Cập nhật"}
            </button>
            <button className="button" onClick={() => history.back()}>
              Đóng
            </button>
          </div>

          {msg && (
            <div
              style={{
                gridColumn: "1 / -1",
                color: "#065f46",
                fontWeight: 700,
              }}
            >
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
