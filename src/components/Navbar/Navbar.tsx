import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import ManagementDropdown from "../ManagementDropdown/ManagementDropdown";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();
  const [openMobile, setOpenMobile] = React.useState(false);

  const loggedIn = !!auth?.token;
  const user = auth?.user;

  const Item = (to: string, label: string) => (
    <NavLink
      to={to}
      onClick={() => setOpenMobile(false)}
      className={({ isActive }) => (isActive ? "active " : "") + " upper"}
    >
      {label}
    </NavLink>
  );

  const handleLogout = () => {
    localStorage.removeItem("auth");
    setAuth(null);
    setOpenMobile(false);
    navigate("/");
  };

  const togglePulldown = (btn: HTMLButtonElement) => {
    const menu = btn.parentElement?.querySelector(".pulldown");
    menu?.classList.toggle("open");
  };

  return (
    <header className="nav">
      <div className="container row">
        <nav className="menu">
          {Item("/", "TRANG CHỦ")}
          {Item("/cay-pha-he", "CÂY PHẢ HỆ")}
          {Item("/thanh-vien", "THÀNH VIÊN")}
          {Item("/bang-vang", "BẢNG VÀNG")}
          {Item("/su-kien", "SỰ KIỆN")}
          {Item("/thu-vien-anh", "THƯ VIỆN ẢNH")}
          {Item("/quy", "QUỸ")}

          {/* Chỉ hiển thị dropdown Quản lý khi đã đăng nhập */}
          {loggedIn && <ManagementDropdown />}

          <div className="nav-right">
            {!loggedIn ? (
              Item("/login", "Đăng Nhập")
            ) : (
              <div className="userArea">
                <span className="hello">Xin chào {user?.name || "Bạn"}</span>
                <button
                  className="avatarBtn"
                  aria-haspopup="menu"
                  aria-label="Tài khoản"
                  onClick={(e) => togglePulldown(e.currentTarget)}
                >
                  <img
                    className="avatar"
                    alt="avatar"
                    src={
                      user?.profile_img ||
                      "https://ui-avatars.com/api/?name=" +
                        encodeURIComponent(user?.name || "User")
                    }
                  />
                </button>
                <div className="pulldown" role="menu">
                  <button
                    className="pd-item"
                    onClick={() => navigate("/profile")}
                  >
                    Thay đổi thông tin
                  </button>
                  <button className="pd-item" onClick={handleLogout}>
                    Thoát
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

        <button
          className="toggle"
          aria-label="Menu"
          onClick={() => setOpenMobile((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z" />
          </svg>
        </button>
      </div>

      {openMobile && (
        <div className="mobile">
          <div className="container">
            {Item("/", "TRANG CHỦ")}
            {Item("/cay-pha-he", "CÂY PHẢ HỆ")}
            {Item("/thanh-vien", "THÀNH VIÊN")}
            {Item("/bang-vang", "BẢNG VÀNG")}
            {Item("/su-kien", "SỰ KIỆN")}
            {Item("/thu-vien-anh", "THƯ VIỆN ẢNH")}
            {Item("/quy", "QUỸ")}
            {loggedIn && (
              <div style={{ margin: "8px 0" }}>
                <ManagementDropdown />
              </div>
            )}
            {!loggedIn ? (
              Item("/login", "Đăng Nhập")
            ) : (
              <div className="userArea mobileUser">
                <span className="hello">Xin chào {user?.name || "Bạn"}</span>
                <button
                  className="pd-item"
                  onClick={() => navigate("/profile")}
                >
                  Thay đổi thông tin
                </button>
                <button className="pd-item" onClick={handleLogout}>
                  Thoát
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
