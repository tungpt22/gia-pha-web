import React from "react";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Đăng nhập với ${email}`);
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
                <label>Tài khoản</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập tên tài khoản"
                />
              </div>

              <div className="field">
                <label>Mật khẩu</label>
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <div className="actions">
              <button className="button button--primary" type="submit">
                Đăng nhập
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
