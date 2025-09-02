import React from "react";
import "./Users.css";

type Activity = {
  time: string;
  desc: string;
  role?: string;
  award?: string;
  kind?: "role" | "event";
};
type User = {
  id: string;
  name: string;
  gender: "Nam" | "Nữ";
  dob?: string;
  dod?: string;
  email?: string;
  phone?: string;
  address?: string;
  role: "Admin" | "Biên tập" | "Thành viên";
  activities?: Activity[];
};

const seed: User[] = [
  {
    id: "u1",
    name: "Nguyễn Văn A",
    gender: "Nam",
    dob: "1970-01-10",
    email: "a@example.com",
    phone: "0901234567",
    address: "Nghệ An",
    role: "Admin",
    activities: [
      {
        time: "1995-2000",
        desc: "Tham gia xây dựng nhà thờ họ",
        role: "Thành viên",
        kind: "role",
      },
      {
        time: "2020",
        desc: "Tham dự đại lễ",
        award: "Sự kiện gia tộc",
        kind: "event",
      },
    ],
  },
  {
    id: "u2",
    name: "Nguyễn Thị B",
    gender: "Nữ",
    dob: "1980-03-22",
    email: "b@example.com",
    phone: "0912345678",
    address: "Hà Nội",
    role: "Biên tập",
  },
  {
    id: "u3",
    name: "Nguyễn Văn C",
    gender: "Nam",
    dob: "2001-09-15",
    email: "c@example.com",
    phone: "0988888888",
    address: "TP.HCM",
    role: "Thành viên",
  },
];

const PAGE_SIZE = 10;

export default function Users() {
  const [q, setQ] = React.useState("");
  const [list, setList] = React.useState<User[]>(seed);

  // PHÂN TRANG
  const [page, setPage] = React.useState(1);
  const total = React.useMemo(
    () =>
      list.filter((u) => u.name.toLowerCase().includes(q.toLowerCase())).length,
    [list, q]
  );
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  React.useEffect(() => {
    setPage(1);
  }, [q]);

  const filtered = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return list
      .filter((u) => u.name.toLowerCase().includes(q.toLowerCase()))
      .slice(start, end);
  }, [list, q, page]);

  // MODALS
  const [picked, setPicked] = React.useState<User | undefined>(undefined);
  const [createMode, setCreateMode] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<User | undefined>(
    undefined
  );

  const onSave = (u: User) => {
    setList((prev) =>
      prev.some((x) => x.id === u.id)
        ? prev.map((x) => (x.id === u.id ? u : x))
        : [...prev, { ...u, id: "u" + (prev.length + 1) }]
    );
    setPicked(u);
    setCreateMode(false);
  };
  const onCreate = (u: User) => {
    setList((prev) => [...prev, { ...u, id: "u" + (prev.length + 1) }]);
    setCreateMode(false);
  };
  const onDelete = (u: User) => {
    setConfirmDelete(undefined);
    setList((prev) => {
      const next = prev.filter((x) => x.id !== u.id);
      if (picked?.id === u.id) setPicked(undefined);
      const newTotal = next.filter((x) =>
        x.name.toLowerCase().includes(q.toLowerCase())
      ).length;
      const newPages = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      setPage((p) => Math.min(p, newPages));
      return next;
    });
  };

  return (
    <section className="section">
      <div className="container">
        <div className="badge">QUẢN LÝ NGƯỜI DÙNG</div>

        <div className="acard shadow-card">
          {/* THANH TÌM KIẾM */}
          <div className="toolbar" style={{ marginBottom: 12 }}>
            <label className="search-label" htmlFor="searchName">
              Tìm kiếm
            </label>
            <input
              id="searchName"
              className="search-input"
              type="text"
              placeholder="Nhập Họ tên..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Tìm kiếm theo họ tên"
            />
            <button
              className="button button--primary button--sm"
              onClick={() => {
                setPicked(undefined);
                setCreateMode(true);
              }}
            >
              + Thêm người dùng
            </button>
          </div>

          {/* THỐNG KÊ */}
          <div className="meta">
            <div>
              Đang hiển thị <strong>{filtered.length}</strong>/
              <strong>{total}</strong> bản ghi
            </div>
            <div></div>
          </div>

          <div className="thead">Kết quả tìm kiếm</div>

          {/* DANH SÁCH + PHÂN TRANG */}
          <div className="list" role="list">
            {filtered.map((u) => (
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
                <div>{u.name}</div>
                <div>{u.phone || "-"}</div>
                <div>{u.email || "-"}</div>
                <div style={{ textAlign: "right" }}>
                  <span className="tag">{u.role}</span>
                </div>
                <div style={{ textAlign: "right" }}>
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
            {filtered.length === 0 && (
              <div
                className="tr"
                style={{ gridTemplateColumns: "1fr", opacity: 0.7 }}
              >
                Không có kết quả phù hợp.
              </div>
            )}
          </div>

          {/* PHÂN TRANG BÊN DƯỚI */}
          <div className="meta" style={{ marginTop: 8 }}>
            <div></div>
            <Pagination page={page} pages={pages} onChange={setPage} />
          </div>
        </div>
      </div>

      {/* MODAL TẠO MỚI */}
      {createMode && (
        <Modal title="Thêm người dùng" onClose={() => setCreateMode(false)}>
          <CreateUserTabs onCreate={onCreate} />
        </Modal>
      )}

      {/* MODAL CHI TIẾT */}
      {picked && !createMode && (
        <Modal title={picked.name} onClose={() => setPicked(undefined)}>
          <UserDetail
            user={picked}
            onSave={(u) => {
              onSave(u);
            }}
          />
        </Modal>
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      {confirmDelete && (
        <Modal
          title="Xóa người dùng"
          onClose={() => setConfirmDelete(undefined)}
        >
          <div className="form">
            <div>
              Bạn có chắc muốn xóa <strong>{confirmDelete.name}</strong> không?
            </div>
            <div className="actions" style={{ marginTop: 8 }}>
              <button
                className="button button--primary"
                onClick={() => onDelete(confirmDelete)}
              >
                Đồng Ý
              </button>
              <button
                className="button"
                onClick={() => setConfirmDelete(undefined)}
              >
                Hủy
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
}) {
  const goto = (p: number) => onChange(Math.min(Math.max(1, p), pages));
  const around = Array.from({ length: pages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.min(pages, page + 2)
  );
  return (
    <div className="pagination" aria-label="Phân trang">
      <button
        className="page-btn"
        onClick={() => goto(1)}
        disabled={page === 1}
        aria-label="Trang đầu"
      >
        «
      </button>
      <button
        className="page-btn"
        onClick={() => goto(page - 1)}
        disabled={page === 1}
        aria-label="Trang trước"
      >
        ‹
      </button>
      {around.map((p) => (
        <button
          key={p}
          className="page-btn"
          onClick={() => goto(p)}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}
      <button
        className="page-btn"
        onClick={() => goto(page + 1)}
        disabled={page === pages}
        aria-label="Trang sau"
      >
        ›
      </button>
      <button
        className="page-btn"
        onClick={() => goto(pages)}
        disabled={page === pages}
        aria-label="Trang cuối"
      >
        »
      </button>
    </div>
  );
}

/** ===== Modal (Pop-up) ===== */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="button" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/** ===== Tabs Tạo mới: Thông tin / Hoạt động ===== */
function CreateUserTabs({ onCreate }: { onCreate: (u: User) => void }) {
  const [u, setU] = React.useState<User>({
    id: "",
    name: "",
    gender: "Nam",
    role: "Thành viên",
    activities: [{ time: "", desc: "", kind: "role" }],
  });
  const [pwd, setPwd] = React.useState("");
  const [tab, setTab] = React.useState<"info" | "activities">("info");

  const InfoTab = (
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
              setU({ ...u, gender: e.target.value as "Nam" | "Nữ" })
            }
          >
            <option>Nam</option>
            <option>Nữ</option>
          </select>
        </div>
      </div>
      <div className="fi">
        <label>Ngày sinh</label>
        <div className="control">
          <input
            type="date"
            value={u.dob || ""}
            onChange={(e) => setU({ ...u, dob: e.target.value })}
          />
          <button
            className="clear-btn"
            onClick={() => setU({ ...u, dob: undefined })}
          >
            Xóa
          </button>
        </div>
      </div>
      <div className="fi">
        <label>Ngày mất</label>
        <div className="control">
          <input
            type="date"
            value={u.dod || ""}
            onChange={(e) => setU({ ...u, dod: e.target.value })}
          />
          <button
            className="clear-btn"
            onClick={() => setU({ ...u, dod: undefined })}
          >
            Xóa
          </button>
        </div>
      </div>
      <div className="fi">
        <label>Email</label>
        <div className="control">
          <input
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
        <div className="control" style={{ maxWidth: "620px" }}>
          <input
            value={u.address || ""}
            onChange={(e) => setU({ ...u, address: e.target.value })}
          />
        </div>
      </div>
      <div className="fi">
        <label>Mật khẩu</label>
        <div className="control">
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
        </div>
      </div>
      <div className="fi">
        <label>Quyền</label>
        <div className="control">
          <select
            value={u.role}
            onChange={(e) =>
              setU({ ...u, role: e.target.value as User["role"] })
            }
          >
            <option>Thành viên</option>
            <option>Biên tập</option>
            <option>Admin</option>
          </select>
        </div>
      </div>
    </div>
  );

  const ActivitiesTab = (
    <div className="form">
      {/* Nút dưới tên tab, căn sát trái */}
      <div className="actions tab-actions" style={{ marginBottom: 6 }}>
        <button
          className="button"
          onClick={() =>
            setU({
              ...u,
              activities: [
                ...(u.activities || []),
                { time: "", desc: "", kind: "role" },
              ],
            })
          }
        >
          + Thêm chức vụ
        </button>
        <button
          className="button"
          onClick={() =>
            setU({
              ...u,
              activities: [
                ...(u.activities || []),
                { time: "", desc: "", kind: "event" },
              ],
            })
          }
        >
          + Thêm sự kiện
        </button>
      </div>

      {(u.activities || []).map((a, i) => {
        const labelMid = a.kind === "event" ? "Sự kiện" : "Chức vụ";
        const valMid = a.kind === "event" ? a.award || "" : a.role || "";
        return (
          <div className="activity-row" key={i}>
            <div className="activity-grid">
              <div className="fi sm">
                <label>Thời Gian</label>
                <div className="control">
                  <input
                    value={a.time}
                    onChange={(e) => {
                      const next = [...(u.activities || [])];
                      next[i] = { ...a, time: e.target.value };
                      setU({ ...u, activities: next });
                    }}
                  />
                </div>
              </div>
              <div className="fi sm">
                <label>{labelMid}</label>
                <div className="control">
                  <input
                    value={valMid}
                    onChange={(e) => {
                      const val = e.target.value;
                      const next = [...(u.activities || [])];
                      if (a.kind === "event") next[i] = { ...a, award: val };
                      else
                        next[i] = { ...a, role: val, kind: a.kind ?? "role" };
                      setU({ ...u, activities: next });
                    }}
                  />
                </div>
              </div>
              <div className="fi sm">
                <label>Mô tả</label>
                <div className="control">
                  <textarea
                    rows={3}
                    value={a.desc}
                    onChange={(e) => {
                      const next = [...(u.activities || [])];
                      next[i] = { ...a, desc: e.target.value };
                      setU({ ...u, activities: next });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <div className="tabbar">
        <button
          className="button"
          onClick={() => setTab("info")}
          style={{ background: tab === "info" ? "#F3F4F6" : "#fff" }}
        >
          Thông tin
        </button>
        <button
          className="button"
          onClick={() => setTab("activities")}
          style={{ background: tab === "activities" ? "#F3F4F6" : "#fff" }}
        >
          Hoạt động
        </button>
      </div>
      {tab === "info" ? InfoTab : ActivitiesTab}
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="button button--primary" onClick={() => onCreate(u)}>
          Thêm
        </button>
      </div>
    </div>
  );
}

/** ===== Chi tiết (sửa) ===== */
function UserDetail({
  user,
  onSave,
}: {
  user: User;
  onSave: (u: User) => void;
}) {
  const [tab, setTab] = React.useState<"info" | "activities">("info");
  const [u, setU] = React.useState<User>({ ...user });
  return (
    <div>
      <div className="tabbar">
        <button
          className="button"
          onClick={() => setTab("info")}
          style={{ background: tab === "info" ? "#F3F4F6" : "#fff" }}
        >
          Thông tin
        </button>
        <button
          className="button"
          onClick={() => setTab("activities")}
          style={{ background: tab === "activities" ? "#F3F4F6" : "#fff" }}
        >
          Quá trình hoạt động
        </button>
      </div>

      {tab === "info" ? (
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
                  setU({ ...u, gender: e.target.value as "Nam" | "Nữ" })
                }
              >
                <option>Nam</option>
                <option>Nữ</option>
              </select>
            </div>
          </div>
          <div className="fi">
            <label>Ngày sinh</label>
            <div className="control">
              <input
                type="date"
                value={u.dob || ""}
                onChange={(e) => setU({ ...u, dob: e.target.value })}
              />
            </div>
          </div>
          <div className="fi">
            <label>Ngày mất</label>
            <div className="control">
              <input
                type="date"
                value={u.dod || ""}
                onChange={(e) => setU({ ...u, dod: e.target.value })}
              />
            </div>
          </div>
          <div className="fi">
            <label>Email</label>
            <div className="control">
              <input
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
            <div className="control" style={{ maxWidth: "620px" }}>
              <input
                value={u.address || ""}
                onChange={(e) => setU({ ...u, address: e.target.value })}
              />
            </div>
          </div>
          <div className="fi">
            <label>Quyền</label>
            <div className="control">
              <select
                value={u.role}
                onChange={(e) =>
                  setU({ ...u, role: e.target.value as User["role"] })
                }
              >
                <option>Admin</option>
                <option>Biên tập</option>
                <option>Thành viên</option>
              </select>
            </div>
          </div>
          <div
            className="actions"
            style={{ gridColumn: "1 / -1", marginTop: 8 }}
          >
            <button
              className="button button--primary"
              onClick={() => onSave(u)}
            >
              Lưu
            </button>
          </div>
        </div>
      ) : (
        <div className="form">
          <div className="actions tab-actions" style={{ marginBottom: 6 }}>
            <button
              className="button"
              onClick={() =>
                setU({
                  ...u,
                  activities: [
                    ...(u.activities || []),
                    { time: "", desc: "", kind: "role" },
                  ],
                })
              }
            >
              + Thêm chức vụ
            </button>
            <button
              className="button"
              onClick={() =>
                setU({
                  ...u,
                  activities: [
                    ...(u.activities || []),
                    { time: "", desc: "", kind: "event" },
                  ],
                })
              }
            >
              + Thêm sự kiện
            </button>
          </div>

          {(u.activities || []).map((a, i) => {
            const labelMid = a.kind === "event" ? "Sự kiện" : "Chức vụ";
            const valMid = a.kind === "event" ? a.award || "" : a.role || "";
            return (
              <div className="activity-row" key={i}>
                <div className="activity-grid">
                  <div className="fi sm">
                    <label>Thời Gian</label>
                    <div className="control">
                      <input
                        value={a.time}
                        onChange={(e) => {
                          const next = [...(u.activities || [])];
                          next[i] = { ...a, time: e.target.value };
                          setU({ ...u, activities: next });
                        }}
                      />
                    </div>
                  </div>
                  <div className="fi sm">
                    <label>{labelMid}</label>
                    <div className="control">
                      <input
                        value={valMid}
                        onChange={(e) => {
                          const val = e.target.value;
                          const next = [...(u.activities || [])];
                          if (a.kind === "event")
                            next[i] = { ...a, award: val };
                          else
                            next[i] = {
                              ...a,
                              role: val,
                              kind: a.kind ?? "role",
                            };
                          setU({ ...u, activities: next });
                        }}
                      />
                    </div>
                  </div>
                  <div className="fi sm">
                    <label>Mô tả</label>
                    <div className="control">
                      <textarea
                        rows={3}
                        value={a.desc}
                        onChange={(e) => {
                          const next = [...(u.activities || [])];
                          next[i] = { ...a, desc: e.target.value };
                          setU({ ...u, activities: next });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="actions" style={{ marginTop: 8 }}>
            <button
              className="button button--primary"
              onClick={() => onSave(u)}
            >
              Lưu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
