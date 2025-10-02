// src/components/Navbar.tsx
import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [openMobile, setOpenMobile] = React.useState(false);
  const [openQL, setOpenQL] = React.useState(false);
  const [openUser, setOpenUser] = React.useState(false);
  const adminRef = React.useRef<HTMLDivElement>(null);
  const userRef = React.useRef<HTMLDivElement>(null);

  // đóng dropdown khi click ra ngoài/ESC
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (adminRef.current && !adminRef.current.contains(e.target as Node))
        setOpenQL(false);
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setOpenUser(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenQL(false);
        setOpenUser(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const item = (to: string, label: string, end = false) => (
    <NavLink
      to={to}
      end={end}
      onClick={() => setOpenMobile(false)}
      className={({ isActive }) =>
        "navbar__link upper" + (isActive ? " active" : "")
      }
    >
      {label}
    </NavLink>
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    setOpenUser(false);
    setOpenMobile(false);
    navigate("/", { replace: true });
  };

  const logged = !!token;

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <button
          className="navbar__toggle"
          aria-label="Mở menu"
          onClick={() => setOpenMobile((v) => !v)}
        >
          ☰
        </button>

        <nav className={"navbar__menu" + (openMobile ? " open" : "")}>
          {item("/", "TRANG CHỦ", true)}
          {item("/cay-gia-pha", "CÂY GIA PHẢ")}
          {item("/bang-vang", "BẢNG VÀNG")}
          {item("/su-kien", "SỰ KIỆN")}
          {item("/tin-tuc", "TIN TỨC")}
          {item("/thu-vien-anh", "THƯ VIỆN ẢNH")}

          {logged && (
            <div
              ref={adminRef}
              className={"dropdown" + (openQL ? " open" : "")}
            >
              <a
                type="button"
                className="navbar__link"
                aria-haspopup="menu"
                aria-expanded={openQL}
                onClick={() => setOpenQL((v) => !v)}
              >
                QUẢN LÝ
              </a>
              <div className="dropdown-menu" role="menu">
                <NavLink
                  className="dropdown-item"
                  to="/admin/users"
                  onClick={() => {
                    setOpenQL(false);
                    setOpenMobile(false);
                  }}
                >
                  Quản lý người dùng
                </NavLink>
                <NavLink
                  className="dropdown-item"
                  to="/admin/events"
                  onClick={() => {
                    setOpenQL(false);
                    setOpenMobile(false);
                  }}
                >
                  Quản lý sự kiện
                </NavLink>
                <NavLink
                  className="dropdown-item"
                  to="/admin/finance"
                  onClick={() => {
                    setOpenQL(false);
                    setOpenMobile(false);
                  }}
                >
                  Quản lý thu chi
                </NavLink>
                <NavLink
                  className="dropdown-item"
                  to="/admin/awards"
                  onClick={() => {
                    setOpenQL(false);
                    setOpenMobile(false);
                  }}
                >
                  Quản lý khen thưởng
                </NavLink>
                <NavLink
                  className="dropdown-item"
                  to="/admin/media"
                  onClick={() => {
                    setOpenQL(false);
                    setOpenMobile(false);
                  }}
                >
                  Quản lý hình ảnh
                </NavLink>
                <NavLink
                  className="dropdown-item"
                  to="/admin/news"
                  onClick={() => {
                    setOpenQL(false);
                    setOpenMobile(false);
                  }}
                >
                  Quản lý tin tức
                </NavLink>
              </div>
            </div>
          )}

          <div className={"navbar__right" + (openMobile ? " show" : "")}>
            {!logged ? (
              <a
                className="navbar__link"
                type="button"
                onClick={() => {
                  setOpenMobile(false);
                  navigate("/login");
                }}
              >
                ĐĂNG NHẬP
              </a>
            ) : (
              <div
                ref={userRef}
                className={"dropdown user-dd" + (openUser ? " open" : "")}
              >
                <a
                  type="button"
                  className="navbar__link"
                  aria-haspopup="menu"
                  aria-expanded={openUser}
                  onClick={() => setOpenUser((v) => !v)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {user?.profile_img ? (
                    <img
                      className="navbar__avatar"
                      src={user.profile_img}
                      alt="avatar"
                    />
                  ) : (
                    <div className="navbar__avatar" />
                  )}
                  <span className="navbar__hello">
                    Xin chào {user?.name || "Bạn"}
                  </span>
                </a>

                <div className="dropdown-menu" role="menu">
                  <NavLink
                    className="dropdown-item"
                    to="/profile"
                    onClick={() => {
                      setOpenUser(false);
                      setOpenMobile(false);
                    }}
                  >
                    Thông tin
                  </NavLink>
                  <a className="dropdown-item" onClick={handleLogout}>
                    Đăng xuất
                  </a>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
