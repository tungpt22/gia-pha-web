import * as React from "react";
// ❌ bỏ import "./Users.css";

import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  saveActivities,
  saveRelationships,
  setApiBase,
  setAccessToken,
  getAccessToken,
  type ListResult,
} from "../../api/usersApi";

/* ========================== TYPES (UI) ========================== */
export type ActivityItem = {
  start_date?: string;
  end_date?: string;
  position?: string;
  reward?: string;
  description?: string;
};

type Role = "Admin" | "Biên tập" | "Thành viên";

export type User = {
  id: string;
  name: string;
  gender: "Nam" | "Nữ";
  dob?: string;
  dod?: string;
  email?: string;
  phone?: string; // map từ backend.phone_number
  address?: string;
  role: Role;
  photoName?: string;
  activities?: ActivityItem[];
  relationships?: {
    father?: string;
    mother?: string;
    spouse?: string;
    children?: string[];
  };
};

/* ======================== TIỆN ÍCH & SORT ======================= */
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
function toUiUser(b: any): User {
  return {
    id: (b?.id ?? b?.user_id ?? "").toString(),
    name: b?.name ?? b?.full_name ?? "",
    gender: b?.gender === "Nam" || b?.gender === "Nữ" ? b.gender : "Nam",
    dob: b?.birthday ?? b?.dob ?? undefined,
    dod: b?.death_day ?? b?.dod ?? undefined,
    email: b?.email ?? undefined,
    phone: b?.phone_number ?? b?.phone ?? undefined,
    address: b?.address ?? undefined,
    role:
      (b?.role === "admin" && "Admin") ||
      (b?.role === "editor" && "Biên tập") ||
      (b?.role === "member" && "Thành viên") ||
      (["Admin", "Biên tập", "Thành viên"].includes(b?.role)
        ? b?.role
        : "Thành viên"),
    photoName: b?.profile_img ?? undefined,
    // map mềm để hỗ trợ cả dữ liệu cũ
    activities: Array.isArray(b?.activities)
      ? b.activities.map((x: any) => ({
          start_date: x.start_date ?? x.startDate ?? x.start ?? "",
          end_date: x.end_date ?? x.endDate ?? x.end ?? "",
          position: x.position ?? x.role ?? "",
          reward: x.reward ?? "",
          description: x.description ?? x.desc ?? "",
        }))
      : [],
    relationships: b?.relationships
      ? {
          father: b.relationships.father ?? "",
          mother: b.relationships.mother ?? "",
          spouse: b.relationships.spouse ?? "",
          children: Array.isArray(b.relationships.children)
            ? b.relationships.children
            : [],
        }
      : undefined,
  };
}

/* ========================= useDebounce ========================== */
function useDebounce<T>(value: T, delay = 400) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* ============================ UI =============================== */
type SortKey = "name" | "gender" | "dob" | "phone" | "address";
type SortDir = "asc" | "desc";

export default function Users() {
  // dữ liệu hiện tại (1 trang từ server)
  const [rows, setRows] = React.useState<User[]>([]);
  // tham số phân trang từ server
  const PAGE_SIZE = 10;
  const [page, setPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  // tìm kiếm (server-side)
  const [keyword, setKeyword] = React.useState("");
  const debouncedKeyword = useDebounce(keyword, 400);

  // popup
  const [picked, setPicked] = React.useState<User | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = React.useState<User | undefined>(
    undefined
  );
  const [createMode, setCreateMode] = React.useState(false);

  // sort trong 1 trang (cục bộ để dễ nhìn)
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  // đảm bảo base & token
  React.useEffect(() => {
    setApiBase("http://localhost:3000/api/v1");
    const t = getAccessToken();
    if (t) setAccessToken(t);
  }, []);

  const refresh = React.useCallback(async (p: number, search: string) => {
    const r: ListResult = await listUsers({
      page: p,
      limit: PAGE_SIZE,
      search: search || undefined,
    });

    // nếu page > totalPages (vd. sau khi xoá) → lùi về trang cuối
    if (r.meta.totalPages > 0 && p > r.meta.totalPages) {
      const last = r.meta.totalPages;
      const r2: ListResult = await listUsers({
        page: last,
        limit: PAGE_SIZE,
        search: search || undefined,
      });
      setRows((r2.items || []).map(toUiUser));
      setTotalItems(r2.meta.totalItems || 0);
      setTotalPages(r2.meta.totalPages || 1);
      setPage(last);
      return;
    }

    setRows((r.items || []).map(toUiUser));
    setTotalItems(r.meta.totalItems || 0);
    setTotalPages(r.meta.totalPages || 1);
  }, []);

  // đổi keyword -> về trang 1
  React.useEffect(() => {
    setPage(1);
  }, [debouncedKeyword]);

  // tải dữ liệu khi page/keyword đổi
  React.useEffect(() => {
    refresh(page, debouncedKeyword).catch((e) =>
      console.error("[Users] listUsers error:", e)
    );
  }, [page, debouncedKeyword, refresh]);

  // sort trong trang
  const sorted = React.useMemo(() => {
    const arr = [...rows];
    const get = (u: User) =>
      sortKey === "name"
        ? u.name
        : sortKey === "gender"
        ? u.gender
        : sortKey === "dob"
        ? u.dob || ""
        : sortKey === "phone"
        ? u.phone || ""
        : u.address || "";
    arr.sort((a, b) => {
      const cmp = String(get(a)).localeCompare(String(get(b)));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const isEmpty = sorted.length === 0;

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  /* ------------------------ CRUD HANDLERS ------------------------ */
  function toBackendPayload(u: User) {
    return {
      id: u.id || undefined,
      name: u.name,
      gender: u.gender,
      birthday: u.dob || null,
      death_day: u.dod || null,
      email: u.email || null,
      phone_number: u.phone || null,
      address: u.address || null,
      role:
        u.role === "Admin"
          ? "admin"
          : u.role === "Biên tập"
          ? "editor"
          : "member",
      profile_img: u.photoName || null,
    };
  }

  const onSaveInfo = async (u: User) => {
    try {
      await updateUser(u.id, toBackendPayload(u));
      setPicked(undefined);
      await refresh(page, debouncedKeyword);
    } catch (e) {
      console.error("Cập nhật thông tin thất bại:", e);
    }
  };
  const onSaveActivities = async (u: User) => {
    try {
      await saveActivities(u.id, u.activities || []);
      setPicked(undefined);
      await refresh(page, debouncedKeyword);
    } catch (e) {
      console.error("Lưu hoạt động thất bại:", e);
    }
  };
  const onSaveRelations = async (u: User) => {
    try {
      await saveRelationships(u.id, u.relationships || { children: [] });
      setPicked(undefined);
      await refresh(page, debouncedKeyword);
    } catch (e) {
      console.error("Lưu quan hệ thất bại:", e);
    }
  };
  const onCreate = async (u: User) => {
    try {
      await createUser(toBackendPayload(u));
      setCreateMode(false);
      setPage(1);
      await refresh(1, debouncedKeyword);
    } catch (e) {
      console.error("Tạo mới thất bại:", e);
    }
  };
  const doDelete = async (u: User) => {
    try {
      await deleteUser(u.id);
      setConfirmDelete(undefined);
      await refresh(page, debouncedKeyword);
    } catch (e) {
      console.error("Xóa thất bại:", e);
    }
  };

  /* --------------------------- UI LIST --------------------------- */
  return (
    <div className="users-wrap">
      <div className="card">
        <div className="page-head">
          <div className="page-title">Quản lý người dùng</div>
          <div style={{ marginLeft: "auto", opacity: 0.9 }}>
            Trang {totalPages ? page : 0}/{totalPages} • Tổng {totalItems} bản
            ghi
          </div>
        </div>

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

        <div className="thead">Kết quả</div>
        {isEmpty && (
          <div className="search-empty-banner">Không tìm thấy kết quả</div>
        )}

        <div className="list" role="list">
          {!isEmpty && (
            <div
              className="users-tr tr--head"
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

          {sorted.map((u) => (
            <div
              key={u.id}
              className="users-tr"
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
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage(1)}
            title="Trang đầu"
          >
            «
          </button>
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            title="Trang trước"
          >
            ‹
          </button>
          {buildPageList(totalPages, page).map((p, i) =>
            typeof p === "number" ? (
              <button
                key={i}
                className={cx("page-btn", p === page && "page-btn--active")}
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
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            title="Trang sau"
          >
            ›
          </button>
          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(totalPages)}
            title="Trang cuối"
          >
            »
          </button>
        </div>
      </div>

      {/* POPUP CHI TIẾT */}
      {picked && !createMode && (
        <Modal title={picked.name} onClose={() => setPicked(undefined)}>
          <UserDetail
            user={picked}
            users={rows}
            onSaveInfo={onSaveInfo}
            onSaveActivities={onSaveActivities}
            onSaveRelations={onSaveRelations}
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

      {/* POPUP XÓA */}
      {confirmDelete && (
        <Modal title="Xác nhận xóa" onClose={() => setConfirmDelete(undefined)}>
          <p>
            Bạn có chắc muốn xóa <b>{confirmDelete.name}</b>?
          </p>
          <div className="actions">
            <button
              className="button button--danger"
              onClick={() => doDelete(confirmDelete)}
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

/* ---------------------- Components phụ ---------------------- */
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

function UserDetail({
  user,
  users,
  onSaveInfo,
  onSaveActivities,
  onSaveRelations,
  onClose,
}: {
  user: User;
  users: User[];
  onSaveInfo: (u: User) => Promise<void>;
  onSaveActivities: (u: User) => Promise<void>;
  onSaveRelations: (u: User) => Promise<void>;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState<"info" | "activities" | "relations">(
    "info"
  );

  const initialActivities: ActivityItem[] =
    user.activities && user.activities.length
      ? user.activities
      : [
          {
            start_date: "",
            end_date: "",
            position: "",
            reward: "",
            description: "",
          },
        ];

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
  const options = (users || [])
    .map((x) => x?.name || "")
    .filter((n) => n && n !== u.name);

  return (
    <div>
      <div className="tabbar">
        <button
          className={"button " + (tab === "info" ? "button--active" : "")}
          onClick={() => setTab("info")}
        >
          Thông tin
        </button>
        <button
          className={"button " + (tab === "activities" ? "button--active" : "")}
          onClick={() => setTab("activities")}
        >
          Quá trình hoạt động
        </button>
        <button
          className={"button " + (tab === "relations" ? "button--active" : "")}
          onClick={() => setTab("relations")}
        >
          Mối quan hệ
        </button>
      </div>

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
                onClick={() => setField("dob")(undefined)}
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
                onClick={() => setField("dod")(undefined)}
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
                onChange={(e) => setField("role")(e.target.value as any)}
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
              onClick={() => onSaveInfo(u)}
            >
              Cập nhật
            </button>
            <button className="button" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      )}

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
                    {
                      start_date: "",
                      end_date: "",
                      position: "",
                      reward: "",
                      description: "",
                    },
                  ],
                }))
              }
            >
              + Thêm
            </button>
          </div>

          <div className="list-plain">
            <div className="row row--head">
              <div>Ngày bắt đầu</div>
              <div>Ngày kết thúc</div>
              <div>Chức vụ</div>
              <div>Khen thưởng</div>
              <div>Mô tả</div>
              <div />
            </div>
            {(
              u.activities || [
                {
                  start_date: "",
                  end_date: "",
                  position: "",
                  reward: "",
                  description: "",
                },
              ]
            ).map((a, i) => (
              <div key={i} className="row">
                {/* start_date */}
                <div className="date-cell control control--with-clear">
                  <input
                    type="date"
                    value={a.start_date || ""}
                    onChange={(e) => {
                      const next = [...(u.activities || [])];
                      next[i] = { ...a, start_date: e.target.value };
                      setU({ ...u, activities: next });
                    }}
                  />
                  <button
                    className="button button--ghost button--icon clear-btn"
                    title="Xóa ngày bắt đầu"
                    onClick={() => {
                      const next = [...(u.activities || [])];
                      next[i] = { ...a, start_date: "" };
                      setU({ ...u, activities: next });
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* end_date */}
                <div className="date-cell control control--with-clear">
                  <input
                    type="date"
                    value={a.end_date || ""}
                    onChange={(e) => {
                      const next = [...(u.activities || [])];
                      next[i] = { ...a, end_date: e.target.value };
                      setU({ ...u, activities: next });
                    }}
                  />
                  <button
                    className="button button--ghost button--icon clear-btn"
                    title="Xóa ngày kết thúc"
                    onClick={() => {
                      const next = [...(u.activities || [])];
                      next[i] = { ...a, end_date: "" };
                      setU({ ...u, activities: next });
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* position */}
                <input
                  placeholder="Chức vụ"
                  value={a.position || ""}
                  onChange={(e) => {
                    const next = [...(u.activities || [])];
                    next[i] = { ...a, position: e.target.value };
                    setU({ ...u, activities: next });
                  }}
                />

                {/* reward */}
                <input
                  placeholder="Khen thưởng"
                  value={a.reward || ""}
                  onChange={(e) => {
                    const next = [...(u.activities || [])];
                    next[i] = { ...a, reward: e.target.value };
                    setU({ ...u, activities: next });
                  }}
                />

                {/* description */}
                <textarea
                  placeholder="Mô tả"
                  value={a.description || ""}
                  onChange={(e) => {
                    const next = [...(u.activities || [])];
                    next[i] = { ...a, description: e.target.value };
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
                        : [
                            {
                              start_date: "",
                              end_date: "",
                              position: "",
                              reward: "",
                              description: "",
                            },
                          ],
                    });
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div
            className="actions actions--center actions--even"
            style={{ marginTop: 8 }}
          >
            <button
              className="button button--primary"
              onClick={() => onSaveActivities(u)}
            >
              Cập nhật
            </button>
            <button className="button" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      )}

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
                  {options.map((n) => (
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
                  {options.map((n) => (
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
                  {options.map((n) => (
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
                      {options.map((n) => (
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
              onClick={() => onSaveRelations(u)}
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

/* ---------------------- Create Popup ------------------------- */
function CreateUser({
  onCreate,
  onClose,
}: {
  onCreate: (u: User) => Promise<void>;
  onClose: () => void;
}) {
  const [u, setU] = React.useState<User>({
    id: "",
    name: "",
    gender: "Nam",
    role: "Thành viên",
    phone: "",
    address: "",
    email: "",
    dob: "",
    dod: "",
    photoName: "",
    activities: [
      {
        start_date: "",
        end_date: "",
        position: "",
        reward: "",
        description: "",
      },
    ],
    relationships: { children: [] },
  });
  const fileRef = React.useRef<HTMLInputElement>(null);
  const canSubmit = (u.name || "").trim().length > 0;
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
        <button
          className="button button--primary"
          disabled={!canSubmit}
          onClick={() => onCreate(u)}
        >
          Lưu
        </button>
        <button className="button" onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}
