import React from "react";
import "./ManagementDropdown.css";

type Props = {
  alignRight?: boolean;
};

export default function ManagementDropdown({ alignRight = false }: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);
  const menuClass =
    "mg-menu " + (open ? "open " : "") + (alignRight ? "align-right" : "");
  return (
    <div className="mg-wrap" ref={ref}>
      <button
        className="mg-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Quản lý
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ opacity: 0.9 }}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>
      <div className={menuClass} role="menu">
        {/* <div className="mg-sep" /> */}
        <a className="mg-item" href="/admin/users" role="menuitem">
          Quản lý người dùng
        </a>
        <a className="mg-item" href="/admin/events" role="menuitem">
          Quản lý sự kiện
        </a>
        <a className="mg-item" href="/admin/finance" role="menuitem">
          Quản lý thu chi
        </a>
        <a className="mg-item" href="/admin/awards" role="menuitem">
          Quản lý khen thưởng
        </a>
        <a className="mg-item" href="/admin/media" role="menuitem">
          Quản lý hình ảnh / tài liệu
        </a>
        <a className="mg-item" href="/admin/news" role="menuitem">
          Quản lý tin tức
        </a>
      </div>
    </div>
  );
}
