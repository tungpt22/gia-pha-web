// src/pages/Login.tsx
import React, { useEffect, useState } from "react";
import "./Login.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { token, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Nếu đã đăng nhập -> về Home (không auto-login)
  useEffect(() => {
    if (token) navigate("/", { replace: true });
  }, [token, navigate]);

  // Tự điền nếu có lưu
  useEffect(() => {
    const savedPhone = localStorage.getItem("savedPhone");
    const savedPassword = localStorage.getItem("savedPassword");
    if (savedPhone && savedPassword) {
      setPhone(savedPhone);
      setPassword(savedPassword);
      setRemember(true);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // ✅ Gọi login đúng chữ ký: (phone_number, password)
      await login(phone.trim(), password);

      // Lưu ghi nhớ nếu cần
      if (remember) {
        localStorage.setItem("savedPhone", phone.trim());
        localStorage.setItem("savedPassword", password);
      } else {
        localStorage.removeItem("savedPhone");
        localStorage.removeItem("savedPassword");
      }

      const next = (location.state as any)?.from?.pathname || "/users";
      navigate(next, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Đăng nhập thất bại");
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
              <div className="savePass-checkbox-field">
                <input
                  type="checkbox"
                  id="chk-remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <label id="lb-remember" htmlFor="chk-remember">
                  Lưu mật khẩu
                </label>
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
