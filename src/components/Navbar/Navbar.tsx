import React from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
import ManagementDropdown from "../ManagementDropdown/ManagementDropdown";
export default function Navbar() {
  const [open, setOpen] = React.useState(false);
  const Item = (to: string, label: string) => (
    <NavLink
      to={to}
      onClick={() => setOpen((v) => !v && false)}
      className={({ isActive }) => (isActive ? "active " : "") + " upper"}
    >
      {label}
    </NavLink>
  );
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
          <ManagementDropdown />
          {Item("/login", "Đăng Nhập")}
          {Item("/logout", "Đăng Xuất")}
        </nav>
        <button
          className="toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="mobile">
          <div className="container">
            {Item("/", "TRANG CHỦ")}
            {Item("/cay-pha-he", "CÂY PHẢ HỆ")}
            {Item("/thanh-vien", "THÀNH VIÊN")}
            {Item("/bang-vang", "BẢNG VÀNG")}
            {Item("/su-kien", "SỰ KIỆN")}
            {Item("/thu-vien-anh", "THƯ VIỆN ẢNH")}
            {Item("/quy", "QUỸ")}
            <div style={{ margin: "8px 0" }}>
              <ManagementDropdown />
            </div>
            {Item("/login", "Đăng Nhập")}
            {Item("/logout", "Đăng Xuất")}
          </div>
        </div>
      )}
    </header>
  );
}
