import React, { useEffect } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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

export default function Login() {
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();

  // Nếu đã login thì không cho vào trang /login
  useEffect(() => {
    if (auth) {
      navigate("/");
    }
  }, [auth, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phone,
          password: password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || "Đăng nhập thất bại");
      }

      const token: string | undefined = json?.data?.access_token;
      const user: AuthUser | undefined = json?.data?.user;

      if (!token || !user) {
        throw new Error("Thiếu dữ liệu trả về từ server");
      }

      const newAuth: AuthState = { token, user };
      localStorage.setItem("auth", JSON.stringify(newAuth));
      setAuth(newAuth); // cập nhật context
      navigate("/"); // quay về trang chủ
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="loginSection">
      <div className="container">
        <div className="login login-card">
          <h2 style={{ marginTop: 0, textAlign: "center", color: "#8B0000" }}>
            Đăng nhập
          </h2>

          <form className="form" onSubmit={onSubmit}>
            <div className="fields">
              <div className="field">
                <label>Số điện thoại</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="field">
                <label>Mật khẩu</label>
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  className="showBtn"
                  onClick={() => setShow((s) => !s)}
                >
                  {show ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</p>
            )}

            <div className="regis-actions">
              <button
                className="button regis-button button--primary"
                type="submit"
                disabled={loading}
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </div>

            <div>
              <a href="#" className="forgotPassword">
                Quên mật khẩu?
              </a>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
