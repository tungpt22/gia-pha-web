import * as React from "react";
// Reuse style từ Users.css để đồng bộ giao diện:
import "../Users/Users.css"; // Đường dẫn tùy cấu trúc dự án của bạn

type AuthUser = {
  id: string;
  name: string;
  role?: string;
  gender?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  birthday?: string | null;
  death_day?: string | null;
  profile_img?: string | null;
};
type AuthState = { token: string; user: AuthUser };

const AUTH_KEY = "auth";
function getAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}
function setAuth(state: AuthState) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export default function ProfileEdit() {
  const auth = getAuth();
  const [user, setUser] = React.useState<AuthUser | null>(auth?.user || null);
  const [msg, setMsg] = React.useState<string | null>(null);

  if (!auth || !user) {
    return (
      <div className="users-wrap">
        <div className="card">
          <div className="page-head">
            <div className="page-title">Chỉnh sửa thông tin</div>
          </div>
          <p>Bạn chưa đăng nhập.</p>
        </div>
      </div>
    );
  }

  const set = <K extends keyof AuthUser>(k: K, v: AuthUser[K]) =>
    setUser((prev) => (prev ? { ...prev, [k]: v } : prev));

  const onSave = async () => {
    // TODO: Nếu có API cập nhật, gọi ở đây.
    // Ví dụ:
    // await fetch("http://localhost:3000/api/v1/users/me", {
    //   method: "PATCH",
    //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
    //   body: JSON.stringify(user),
    // });

    // Tạm thời lưu local cho bạn xem UI:
    setAuth({ token: auth.token, user });
    setMsg("Đã cập nhật thông tin (local).");
    setTimeout(() => setMsg(null), 2000);
  };

  return (
    <div className="users-wrap">
      <div className="card">
        <div className="page-head">
          <div className="page-title">Chỉnh sửa thông tin</div>
        </div>

        <div className="form form-grid">
          <div className="fi">
            <label>Họ tên</label>
            <div className="control">
              <input
                value={user.name || ""}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
          </div>

          <div className="fi">
            <label>Giới tính</label>
            <div className="control">
              <select
                value={user.gender || ""}
                onChange={(e) => set("gender", e.target.value)}
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
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </div>

          <div className="fi">
            <label>Số điện thoại</label>
            <div className="control">
              <input
                value={user.phone_number || ""}
                onChange={(e) => set("phone_number", e.target.value)}
              />
            </div>
          </div>

          <div className="fi" style={{ gridColumn: "1 / -1" }}>
            <label>Địa chỉ</label>
            <div className="control">
              <input
                value={user.address || ""}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
          </div>

          <div className="fi">
            <label>Ngày sinh</label>
            <div className="control">
              <input
                type="date"
                value={user.birthday ? user.birthday.substring(0, 10) : ""}
                onChange={(e) => set("birthday", e.target.value || null)}
              />
            </div>
          </div>

          <div className="fi">
            <label>Ngày mất</label>
            <div className="control">
              <input
                type="date"
                value={user.death_day ? user.death_day.substring(0, 10) : ""}
                onChange={(e) => set("death_day", e.target.value || null)}
              />
            </div>
          </div>

          <div className="fi" style={{ gridColumn: "1 / -1" }}>
            <label>Ảnh đại diện (URL)</label>
            <div className="control">
              <input
                placeholder="https://example.com/avatar.jpg"
                value={user.profile_img || ""}
                onChange={(e) => set("profile_img", e.target.value)}
              />
            </div>
          </div>

          <div
            className="actions actions--center actions--even"
            style={{ gridColumn: "1 / -1" }}
          >
            <button className="button button--primary" onClick={onSave}>
              Cập nhật
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
