import * as React from "react";
import "./Users.css";

/* ====== TYPES ====== */
type Activity =
  | { kind: "role"; time: string; desc: string }
  | { kind: "event"; time: string; desc: string };

type Role = "Admin" | "Biên tập" | "Thành viên";

export type User = {
  id: string;
  name: string;
  gender: "Nam" | "Nữ";
  dob?: string;
  dod?: string;
  email?: string;
  phone?: string;
  address?: string;
  role: Role;
  photoName?: string;
  activities?: Activity[];
  relationships?: {
    father?: string; // giá trị lưu theo tên (dropdown hiển thị theo tên)
    mother?: string;
    spouse?: string; // Vợ/Chồng tùy theo giới tính
    children?: string[];
  };
};

/* ====== MOCK DATA (có thể thay bằng API) ====== */
const initialUsers: User[] = [
  {
    id: "u1",
    name: "Nguyễn Văn A",
    gender: "Nam",
    dob: "1970-04-20",
    phone: "0900000001",
    address: "Hà Nội",
    role: "Thành viên",
    activities: [
      { kind: "role", time: "1990-1995", desc: "Bí thư chi đoàn" },
      { kind: "event", time: "2000", desc: "Tham gia hoạt động xã hội" },
    ],
    relationships: {
      father: "Nguyễn Văn B",
      mother: "Trần Thị C",
      spouse: "Trần Thị D",
      children: ["Nguyễn Văn E"],
    },
  },
  {
    id: "u2",
    name: "Trần Thị Mai",
    gender: "Nữ",
    dob: "1985-01-10",
    phone: "0900000002",
    address: "TP.HCM",
    role: "Biên tập",
    activities: [{ kind: "role", time: "2010-2013", desc: "Tổ phó" }],
    relationships: {
      father: "Trần Văn X",
      mother: "Ngô Thị Y",
      spouse: "Phạm Văn Z",
      children: ["Phạm Trần K", "Phạm Trần L"],
    },
  },
];

/* ====== TIỆN ÍCH NHỎ ====== */
function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function buildPageList(total: number, current: number) {
  const pages: (number | string)[] = [];
  const window = 1;
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current - window > 2) pages.push("…");
    for (
      let i = Math.max(2, current - window);
      i <= Math.min(total - 1, current + window);
      i++
    )
      pages.push(i);
    if (current + window < total - 1) pages.push("…");
    pages.push(total);
  }
  return pages;
}

/* ====== MODAL ====== */
function Modal({
  title,
  onClose,
  children,
}: {
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          {!!onClose && (
            <button className="button button--ghost" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ====== CHI TIẾT USER (POPUP) ====== */
function UserDetail({
  user,
  users,
  onSave,
  onClose,
}: {
  user: User;
  users: User[];
  onSave: (u: User) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState<"info" | "activities" | "relations">(
    "info"
  );

  const initialActivities: Activity[] =
    user.activities && user.activities.length > 0
      ? user.activities
      : [{ kind: "role" as const, time: "", desc: "" }];

  const [u, setU] = React.useState<User>({
    ...user,
    activities: initialActivities,
    relationships: {
      father: user.relationships?.father || "",
      mother: user.relationships?.mother || "",
      spouse: user.relationships?.spouse || "",
      children: user.relationships?.children || [""],
    },
  });

  const setField =
    <K extends keyof User>(key: K) =>
    (value: User[K]) =>
      setU((prev) => ({ ...prev, [key]: value }));

  const fileRef = React.useRef<HTMLInputElement>(null);
  const nameOptions = users.map((x) => x.name).filter((n) => n !== u.name); // tránh chọn chính mình

  /* ====== RENDER ====== */
  return (
    <div>
      {/* TAB BAR */}
      <div className="tabbar">
        <button
          className={cx("button", tab === "info" && "button--active")}
          onClick={() => setTab("info")}
        >
          Thông tin
        </button>
        <button
          className={cx("button", tab === "activities" && "button--active")}
          onClick={() => setTab("activities")}
        >
          Quá trình hoạt động
        </button>
        <button
          className={cx("button", tab === "relations" && "button--active")}
          onClick={() => setTab("relations")}
        >
          Mối quan hệ
        </button>
      </div>

      {/* TAB: THÔNG TIN */}
      {tab === "info" && (
        <div className="form form-grid">
          <div className="fi">
            <label>Họ tên</label>
            <div className="control">
              <input
                value={u.name}
                onChange={(e) => setField("name")(e.target.value)}
              />
            </div>
          </div>

          <div className="fi">
            <label>Giới tính</label>
            <div className="control">
              <select
                value={u.gender}
                onChange={(e) =>
                  setField("gender")(e.target.value as User["gender"])
                }
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
          </div>

          <div className="fi fi--date">
            <label>Ngày sinh</label>
            <div className="control control--with-clear">
              <input
                type="date"
                value={u.dob || ""}
                onChange={(e) => setField("dob")(e.target.value)}
              />
              <button
                className="button button--ghost button--icon clear-btn"
                title="Xóa dữ liệu ngày sinh"
                onClick={() => setField("dob")(undefined)}
                aria-label="Xóa dữ liệu ngày sinh"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="fi fi--date">
            <label>Ngày mất</label>
            <div className="control control--with-clear">
              <input
                type="date"
                value={u.dod || ""}
                onChange={(e) => setField("dod")(e.target.value)}
              />
              <button
                className="button button--ghost button--icon clear-btn"
                title="Xóa dữ liệu ngày mất"
                onClick={() => setField("dod")(undefined)}
                aria-label="Xóa dữ liệu ngày mất"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="fi">
            <label>Email</label>
            <div className="control">
              <input
                type="email"
                value={u.email || ""}
                onChange={(e) => setField("email")(e.target.value)}
              />
            </div>
          </div>

          <div className="fi">
            <label>Số điện thoại</label>
            <div className="control">
              <input
                value={u.phone || ""}
                onChange={(e) => setField("phone")(e.target.value)}
              />
            </div>
          </div>

          <div className="fi" style={{ gridColumn: "1 / -1" }}>
            <label>Địa chỉ</label>
            <div className="control">
              <input
                value={u.address || ""}
                onChange={(e) => setField("address")(e.target.value)}
              />
            </div>
          </div>

          <div className="fi">
            <label>Vai trò</label>
            <div className="control">
              <select
                value={u.role}
                onChange={(e) => setField("role")(e.target.value as Role)}
              >
                <option>Thành viên</option>
                <option>Biên tập</option>
                <option>Admin</option>
              </select>
            </div>
          </div>

          <div className="fi" style={{ gridColumn: "1 / -1" }}>
            <label>Ảnh</label>
            <div className="control">
              <button
                className="button"
                onClick={() => fileRef.current?.click()}
              >
                Upload
              </button>
              <input
                ref={fileRef}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.currentTarget.files?.[0];
                  if (f) setField("photoName")(f.name);
                }}
              />
              <input
                placeholder="Tên file ảnh"
                value={u.photoName || ""}
                onChange={(e) => setField("photoName")(e.target.value)}
              />
            </div>
          </div>

          <div
            className="actions actions--center actions--even"
            style={{ gridColumn: "1 / -1", marginTop: 8 }}
          >
            <button
              className="button button--primary"
              onClick={() => onSave(u)}
            >
              Cập nhật
            </button>
            <button className="button" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* TAB: HOẠT ĐỘNG */}
      {tab === "activities" && (
        <div className="form">
          <div className="actions tab-actions" style={{ marginBottom: 6 }}>
            <button
              className="button"
              onClick={() =>
                setU((prev) => ({
                  ...prev,
                  activities: [
                    ...(prev.activities || []),
                    { time: "", desc: "", kind: "role" },
                  ],
                }))
              }
            >
              + Thêm chức vụ
            </button>
            <button
              className="button"
              onClick={() =>
                setU((prev) => ({
                  ...prev,
                  activities: [
                    ...(prev.activities || []),
                    { time: "", desc: "", kind: "event" },
                  ],
                }))
              }
            >
              + Thêm sự kiện
            </button>
          </div>

          <div className="list-plain">
            <div className="row row--head">
              <div>Hoạt động</div>
              <div>Thời gian</div>
              <div>Mô tả</div>
              <div />
            </div>

            {(u.activities || [{ kind: "role", time: "", desc: "" }]).map(
              (a, i) => (
                <div key={i} className="row">
                  <select
                    value={a.kind}
                    onChange={(e) => {
                      const next = [...(u.activities || [])];
                      next[i] = {
                        ...a,
                        kind: e.target.value as Activity["kind"],
                      };
                      setU({ ...u, activities: next });
                    }}
                  >
                    <option value="role">Chức vụ</option>
                    <option value="event">Sự kiện</option>
                  </select>
                  <input
                    placeholder="Thời gian"
                    value={a.time}
                    onChange={(e) => {
                      const next = [...(u.activities || [])];
                      next[i] = { ...a, time: e.target.value };
                      setU({ ...u, activities: next });
                    }}
                  />
                  <input
                    placeholder="Mô tả"
                    value={a.desc}
                    onChange={(e) => {
                      const next = [...(u.activities || [])];
                      next[i] = { ...a, desc: e.target.value };
                      setU({ ...u, activities: next });
                    }}
                  />
                  <button
                    className="button button--ghost button--icon"
                    title="Xóa dòng"
                    onClick={() => {
                      const next = [...(u.activities || [])];
                      next.splice(i, 1);
                      setU({
                        ...u,
                        activities: next.length
                          ? next
                          : [{ kind: "role", time: "", desc: "" }],
                      });
                    }}
                  >
                    ✕
                  </button>
                </div>
              )
            )}
          </div>

          <div
            className="actions actions--center actions--even"
            style={{ marginTop: 8 }}
          >
            <button
              className="button button--primary"
              onClick={() => onSave(u)}
            >
              Cập nhật
            </button>
            <button className="button" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* TAB: MỐI QUAN HỆ — dropdown toàn bộ người dùng */}
      {tab === "relations" && (
        <div className="form">
          <div className="form-grid">
            <div className="fi">
              <label>Bố</label>
              <div className="control">
                <select
                  value={u.relationships?.father || ""}
                  onChange={(e) =>
                    setU({
                      ...u,
                      relationships: {
                        ...u.relationships,
                        father: e.target.value,
                      },
                    })
                  }
                >
                  <option value="">-- Chọn --</option>
                  {nameOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fi">
              <label>Mẹ</label>
              <div className="control">
                <select
                  value={u.relationships?.mother || ""}
                  onChange={(e) =>
                    setU({
                      ...u,
                      relationships: {
                        ...u.relationships,
                        mother: e.target.value,
                      },
                    })
                  }
                >
                  <option value="">-- Chọn --</option>
                  {nameOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fi">
              <label>{u.gender === "Nam" ? "Vợ" : "Chồng"}</label>
              <div className="control">
                <select
                  value={u.relationships?.spouse || ""}
                  onChange={(e) =>
                    setU({
                      ...u,
                      relationships: {
                        ...u.relationships,
                        spouse: e.target.value,
                      },
                    })
                  }
                >
                  <option value="">-- Chọn --</option>
                  {nameOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fi" style={{ gridColumn: "1 / -1" }}>
              <label>Con</label>
              <div className="control" style={{ flexWrap: "wrap", gap: 8 }}>
                {(u.relationships?.children || [""]).map((c, i) => (
                  <div key={i} className="child-chip">
                    <select
                      value={c}
                      onChange={(e) => {
                        const next = [...(u.relationships?.children || [])];
                        next[i] = e.target.value;
                        setU({
                          ...u,
                          relationships: { ...u.relationships, children: next },
                        });
                      }}
                      style={{ minWidth: 220 }}
                    >
                      <option value="">-- Chọn --</option>
                      {nameOptions.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <button
                      className="button button--ghost button--icon"
                      title="Xóa con này"
                      onClick={() => {
                        const next = [...(u.relationships?.children || [])];
                        next.splice(i, 1);
                        setU({
                          ...u,
                          relationships: { ...u.relationships, children: next },
                        });
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  className="button"
                  onClick={() => {
                    const next = [...(u.relationships?.children || []), ""];
                    setU({
                      ...u,
                      relationships: { ...u.relationships, children: next },
                    });
                  }}
                >
                  + Thêm
                </button>
              </div>
            </div>
          </div>

          <div
            className="actions actions--center actions--even"
            style={{ marginTop: 8 }}
          >
            <button
              className="button button--primary"
              onClick={() => onSave(u)}
            >
              Cập nhật
            </button>
            <button className="button" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ====== TRANG DANH SÁCH / TÌM KIẾM + PHÂN TRANG ====== */
type SortKey = "name" | "gender" | "dob" | "phone" | "address";
type SortDir = "asc" | "desc";

export default function Users() {
  const [users, setUsers] = React.useState<User[]>(initialUsers);
  const [keyword, setKeyword] = React.useState("");
  const [picked, setPicked] = React.useState<User | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = React.useState<User | undefined>(
    undefined
  );
  const [createMode, setCreateMode] = React.useState(false);

  // Pagination (10 bản ghi/trang)
  const PAGE_SIZE = 10;
  const [page, setPage] = React.useState(1);

  // Sorting
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  const filtered = React.useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return users;
    return users.filter((u) => {
      const hay = `${u.name} ${u.gender} ${u.phone || ""} ${u.email || ""} ${
        u.address || ""
      }`.toLowerCase();
      return hay.includes(kw);
    });
  }, [users, keyword]);

  // Sort trước khi phân trang
  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    const get = (u: User) => {
      switch (sortKey) {
        case "name":
          return u.name || "";
        case "gender":
          return u.gender || "";
        case "dob":
          return u.dob || "";
        case "phone":
          return u.phone || "";
        case "address":
          return u.address || "";
      }
    };
    arr.sort((a, b) => {
      const av = get(a) || "";
      const bv = get(b) || "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  React.useEffect(() => {
    setPage(1);
  }, [keyword, sortKey, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isEmpty = total === 0;
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const paginated = sorted.slice(start, start + PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  const onSave = (u: User) => {
    // Cập nhật & đóng popup như yêu cầu
    setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
    setPicked(undefined);
  };

  const onCreate = (u: User) => {
    // Thêm & ĐÓNG popup thêm mới
    setUsers((prev) => [u, ...prev]);
    setCreateMode(false);
    // Không tự động mở popup chi tiết
  };

  return (
    <div className="users-wrap">
      <div className="card">
        {/* TIÊU ĐỀ MÀN HÌNH */}
        <div className="page-head">
          <div className="page-title">Quản lý người dùng</div>
        </div>

        {/* TÌM KIẾM + THÊM MỚI + ĐẾM BẢN GHI */}
        <div className="toolbar">
          <div className="search-group">
            <label htmlFor="searchInput" className="search-label">
              Tìm kiếm
            </label>
            <input
              id="searchInput"
              className="search"
              placeholder="Tìm theo tên, số điện thoại, địa chỉ…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="toolbar-right">
            <button
              className="button button--primary add-btn"
              onClick={() => {
                setCreateMode(true);
                setPicked(undefined);
              }}
              title="Thêm người mới"
            >
              + Thêm người dùng mới
            </button>
          </div>
        </div>

        <div className="thead">Kết quả tìm kiếm</div>
        <div className="count">Tổng: {total} kết quả</div>
        {isEmpty && keyword.trim() !== "" && (
          <div className="search-empty-banner">Không tìm thấy kết quả</div>
        )}
        {/* DANH SÁCH */}
        <div className="list" role="list">
          {/* HEADER có nút mũi tên sắp xếp */}
          {!isEmpty && (
            <div
              className="tr tr--head"
              role="presentation"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="th" onClick={() => toggleSort("name")}>
                <span>Họ tên</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      sortKey === "name" && sortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      sortKey === "name" && sortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSort("gender")}>
                <span>Giới tính</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      sortKey === "gender" && sortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      sortKey === "gender" && sortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSort("dob")}>
                <span>Ngày sinh</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      sortKey === "dob" && sortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      sortKey === "dob" && sortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSort("phone")}>
                <span>Số điện thoại</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      sortKey === "phone" && sortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      sortKey === "phone" && sortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSort("address")}>
                <span>Địa chỉ</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      sortKey === "address" && sortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      sortKey === "address" && sortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
            </div>
          )}
          {paginated.map((u) => (
            <div
              key={u.id}
              className="tr"
              role="listitem"
              onClick={() => {
                setPicked(u);
                setCreateMode(false);
              }}
              style={{ cursor: "pointer" }}
              title="Xem chi tiết"
            >
              <div className="td td--name">{u.name}</div>
              <div className="td td--gender">{u.gender}</div>
              <div className="td">{u.dob || "-"}</div>
              <div className="td">{u.phone || "-"}</div>
              <div className="td td--address">{u.address || "-"}</div>
              <div
                style={{
                  textAlign: "right",
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPicked(u);
                    setCreateMode(false);
                  }}
                >
                  Xem chi tiết
                </button>
                <button
                  className="button button--danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(u);
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* PHÂN TRANG */}
        {!isEmpty && totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={current <= 1}
              onClick={() => setPage(1)}
              title="Trang đầu"
            >
              «
            </button>
            <button
              className="page-btn"
              disabled={current <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              title="Trang trước"
            >
              ‹
            </button>
            {buildPageList(totalPages, current).map((p, i) =>
              typeof p === "number" ? (
                <button
                  key={i}
                  className={cx(
                    "page-btn",
                    p === current && "page-btn--active"
                  )}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ) : (
                <span key={i} className="page-ellipsis">
                  {p}
                </span>
              )
            )}
            <button
              className="page-btn"
              disabled={current >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              title="Trang sau"
            >
              ›
            </button>
            <button
              className="page-btn"
              disabled={current >= totalPages}
              onClick={() => setPage(totalPages)}
              title="Trang cuối"
            >
              »
            </button>
          </div>
        )}
      </div>

      {/* POPUP CHI TIẾT (XEM/CẬP NHẬT) */}
      {picked && !createMode && (
        <Modal title={picked.name} onClose={() => setPicked(undefined)}>
          <UserDetail
            user={picked}
            users={users}
            onSave={onSave}
            onClose={() => setPicked(undefined)}
          />
        </Modal>
      )}

      {/* POPUP THÊM MỚI */}
      {createMode && (
        <Modal title="Thêm người mới" onClose={() => setCreateMode(false)}>
          <CreateUser
            onCreate={onCreate}
            onClose={() => setCreateMode(false)}
          />
        </Modal>
      )}

      {/* XÁC NHẬN XÓA */}
      {confirmDelete && (
        <Modal title="Xác nhận xóa" onClose={() => setConfirmDelete(undefined)}>
          <p>
            Bạn có chắc muốn xóa <b>{confirmDelete.name}</b>?
          </p>
          <div className="actions">
            <button
              className="button button--danger"
              onClick={() => {
                setUsers((prev) =>
                  prev.filter((x) => x.id !== confirmDelete.id)
                );
                setConfirmDelete(undefined);
                if (picked?.id === confirmDelete.id) setPicked(undefined);
              }}
            >
              Xóa
            </button>
            <button
              className="button"
              onClick={() => setConfirmDelete(undefined)}
            >
              Hủy
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ====== FORM TẠO MỚI (giống tab Thông tin) ====== */
function CreateUser({
  onCreate,
  onClose,
}: {
  onCreate: (u: User) => void;
  onClose: () => void;
}) {
  const [u, setU] = React.useState<User>({
    id: `u_${Date.now()}`,
    name: "",
    gender: "Nam",
    role: "Thành viên",
    phone: "",
    address: "",
    email: "",
    dob: "",
    dod: "",
    photoName: "",
    activities: [{ kind: "role", time: "", desc: "" }],
    relationships: { children: [] },
  });

  const fileRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="form form-grid">
      <div className="fi">
        <label>Họ tên</label>
        <div className="control">
          <input
            value={u.name}
            onChange={(e) => setU({ ...u, name: e.target.value })}
          />
        </div>
      </div>

      <div className="fi">
        <label>Giới tính</label>
        <div className="control">
          <select
            value={u.gender}
            onChange={(e) =>
              setU({ ...u, gender: e.target.value as User["gender"] })
            }
          >
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>
      </div>

      <div className="fi fi--date">
        <label>Ngày sinh</label>
        <div className="control control--with-clear">
          <input
            type="date"
            value={u.dob || ""}
            onChange={(e) => setU({ ...u, dob: e.target.value })}
          />
          <button
            className="button button--ghost button--icon clear-btn"
            onClick={() => setU({ ...u, dob: undefined })}
            title="Xóa dữ liệu ngày sinh"
            aria-label="Xóa dữ liệu ngày sinh"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="fi fi--date">
        <label>Ngày mất</label>
        <div className="control control--with-clear">
          <input
            type="date"
            value={u.dod || ""}
            onChange={(e) => setU({ ...u, dod: e.target.value })}
          />
          <button
            className="button button--ghost button--icon clear-btn"
            onClick={() => setU({ ...u, dod: undefined })}
            title="Xóa dữ liệu ngày mất"
            aria-label="Xóa dữ liệu ngày mất"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="fi">
        <label>Email</label>
        <div className="control">
          <input
            type="email"
            value={u.email || ""}
            onChange={(e) => setU({ ...u, email: e.target.value })}
          />
        </div>
      </div>

      <div className="fi">
        <label>Số điện thoại</label>
        <div className="control">
          <input
            value={u.phone || ""}
            onChange={(e) => setU({ ...u, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="fi" style={{ gridColumn: "1 / -1" }}>
        <label>Địa chỉ</label>
        <div className="control">
          <input
            value={u.address || ""}
            onChange={(e) => setU({ ...u, address: e.target.value })}
          />
        </div>
      </div>

      <div className="fi">
        <label>Vai trò</label>
        <div className="control">
          <select
            value={u.role}
            onChange={(e) => setU({ ...u, role: e.target.value as Role })}
          >
            <option>Thành viên</option>
            <option>Biên tập</option>
            <option>Admin</option>
          </select>
        </div>
      </div>

      <div className="fi" style={{ gridColumn: "1 / -1" }}>
        <label>Ảnh</label>
        <div className="control">
          <button className="button" onClick={() => fileRef.current?.click()}>
            Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              if (f) setU({ ...u, photoName: f.name });
            }}
          />
          <input
            placeholder="Tên file ảnh"
            value={u.photoName || ""}
            onChange={(e) => setU({ ...u, photoName: e.target.value })}
          />
        </div>
      </div>

      <div
        className="actions actions--center actions--even"
        style={{ gridColumn: "1 / -1" }}
      >
        <button className="button button--primary" onClick={() => onCreate(u)}>
          Lưu
        </button>
        <button className="button" onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}
