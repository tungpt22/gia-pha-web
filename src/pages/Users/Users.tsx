import * as React from "react";
import "./Users.css";

import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  // activities
  getActivities,
  addActivities,
  deleteActivities,
  // relationships
  getUserRelationships,
  addRelationship,
  deleteRelationship,
  listNotChildUsers,
  listNotWifeUsers,
  listNotHusbandUsers,
  setApiBase,
  setAccessToken,
  getAccessToken,
  type ListResult,
  type UserOption,
} from "../../api/usersApi";

/* ========================== TYPES (UI) ========================== */
export type ActivityItem = {
  id?: string;
  start_date?: string;
  end_date?: string;
  position?: string;
  reward?: string;
  description?: string;
  _markedDelete?: boolean;
};

type Role = "Admin" | "Thành viên";

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
      (b?.role === "member" && "Thành viên") ||
      (["Admin", "Thành viên"].includes(b?.role) ? b?.role : "Thành viên"),
    photoName: b?.profile_img ?? undefined,
    activities: Array.isArray(b?.activities)
      ? b.activities.map((x: any) => ({
          id: x.id,
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

type SortKey = "name" | "gender" | "dob" | "phone" | "address";
type SortDir = "asc" | "desc";

/* ============================ APP =============================== */
export default function Users() {
  const [rows, setRows] = React.useState<User[]>([]);
  const PAGE_SIZE = 10;
  const [page, setPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [keyword, setKeyword] = React.useState("");
  const debouncedKeyword = useDebounce(keyword, 400);

  const [picked, setPicked] = React.useState<User | undefined>(undefined);
  const [createMode, setCreateMode] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<User | undefined>(
    undefined
  );

  const [notice, setNotice] = React.useState<{
    title?: string;
    message: string;
  } | null>(null);

  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  React.useEffect(() => {
    setApiBase("http://localhost:3000/api/v1");
    const t = getAccessToken();
    if (t) setAccessToken(t);
  }, []);

  const refresh = React.useCallback(async (p: number, search: string) => {
    try {
      const r: ListResult = await listUsers({
        page: p,
        limit: PAGE_SIZE,
        search: search || undefined,
      });
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
    } catch (e: any) {
      setNotice({
        title: "Lỗi",
        message: `Tải danh sách thất bại: ${e?.message || e}`,
      });
    }
  }, []);

  React.useEffect(() => setPage(1), [debouncedKeyword]);

  React.useEffect(() => {
    refresh(page, debouncedKeyword).catch((e) =>
      setNotice({
        title: "Lỗi",
        message: `Không tải được danh sách: ${e?.message || e}`,
      })
    );
  }, [page, debouncedKeyword, refresh]);

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
      role: u.role === "Admin" ? "admin" : "member",
      profile_img: u.photoName || null,
    };
  }

  const onSaveInfo = async (u: User) => {
    try {
      await updateUser(u.id, toBackendPayload(u));
      setPicked(undefined);
      await refresh(page, debouncedKeyword);
      setNotice({
        title: "Thành công",
        message: "Cập nhật thông tin người dùng thành công.",
      });
    } catch (e: any) {
      setNotice({
        title: "Lỗi",
        message: `Cập nhật thông tin thất bại: ${e?.message || e}`,
      });
    }
  };

  const onCreate = async (u: User) => {
    try {
      await createUser(toBackendPayload(u));
      setCreateMode(false);
      setPage(1);
      await refresh(1, debouncedKeyword);
      setNotice({
        title: "Thành công",
        message: "Thêm người dùng mới thành công.",
      });
    } catch (e: any) {
      setNotice({
        title: "Lỗi",
        message: `Tạo mới thất bại: ${e?.message || e}`,
      });
    }
  };

  const doDelete = async (u: User) => {
    try {
      await deleteUser(u.id);
      setConfirmDelete(undefined);
      await refresh(page, debouncedKeyword);
      setNotice({ title: "Thành công", message: "Xoá người dùng thành công." });
    } catch (e: any) {
      setConfirmDelete(undefined);
      setNotice({ title: "Lỗi", message: `Xoá thất bại: ${e?.message || e}` });
    }
  };

  /* ============================ RENDER ============================ */
  const isEmpty = sorted.length === 0;

  return (
    <div className="users-wrap">
      <div className="card">
        <div className="page-head">
          <div className="page-title">Quản lý người dùng</div>
        </div>

        <div className="toolbar">
          <div className="search-group">
            <label htmlFor="searchInput" className="search-label">
              Tìm kiếm
            </label>
            <input
              id="searchInput"
              className="search"
              placeholder="Tìm theo tên/ số điện thoại"
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
        <div style={{ marginLeft: "auto", opacity: 0.9 }}>
          Trang {totalPages ? page : 0}/{totalPages} • Tổng {totalItems} bản ghi
        </div>
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
            onClose={() => setPicked(undefined)}
            onGlobalNotice={(n) => setNotice(n)}
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

      {/* POPUP THÔNG BÁO (toàn cục) */}
      {notice && (
        <Modal
          title={notice.title || "Thông báo"}
          onClose={() => setNotice(null)}
        >
          <p>{notice.message}</p>
          <div className="actions actions--center" style={{ marginTop: 8 }}>
            <button
              className="button button--primary"
              onClick={() => setNotice(null)}
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------- Modal ---------------------- */
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
    <div className="modal-backdrop">
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

/* ---------------------- Components phụ ---------------------- */
function UserDetail({
  user,
  users,
  onSaveInfo,
  onClose,
  onGlobalNotice,
}: {
  user: User;
  users: User[];
  onSaveInfo: (u: User) => Promise<void>;
  onClose: () => void;
  onGlobalNotice: (n: { title?: string; message: string } | null) => void;
}) {
  const [tab, setTab] = React.useState<"info" | "activities" | "relations">(
    "info"
  );

  // ===== activities state (giữ nguyên logic) =====
  const [loadedActivities, setLoadedActivities] = React.useState(false);
  const [originalActivities, setOriginalActivities] = React.useState<
    ActivityItem[] | undefined
  >(undefined);

  const [u, setU] = React.useState<User>({
    ...user,
    activities:
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
          ],
    relationships: {
      father: user.relationships?.father || "",
      mother: user.relationships?.mother || "",
      spouse: user.relationships?.spouse || "",
      children: user.relationships?.children || [""],
    },
  });

  // ----- local notice cho tab -----
  const [localNotice, setLocalNotice] = React.useState<{
    title?: string;
    message: string;
  } | null>(null);

  // ====== RELATIONSHIPS ======
  type RelItem = {
    id: string;
    relation_type: "Con" | "Vợ" | "Chồng" | string;
    to_user: {
      id: string;
      name: string;
      gender?: string;
      birthday?: string | null;
      death_day?: string | null;
      phone_number?: string | null;
    };
  };
  const [rels, setRels] = React.useState<RelItem[]>([]);
  const [childOpts, setChildOpts] = React.useState<UserOption[]>([]);
  const [spouseOpts, setSpouseOpts] = React.useState<UserOption[]>([]);
  const spouseLabel: "Vợ" | "Chồng" = u.gender === "Nam" ? "Vợ" : "Chồng";

  // slots mới (chờ Cập nhật)
  type Slot = { key: number; selectedId?: string };
  const [newChildSlots, setNewChildSlots] = React.useState<Slot[]>([]);
  const [newSpouseSlots, setNewSpouseSlots] = React.useState<Slot[]>([]);

  // modal xem user
  const [viewUser, setViewUser] = React.useState<RelItem["to_user"] | null>(
    null
  );

  async function refreshRelationshipsAndOptions() {
    try {
      const [relList, childList, spouseList] = await Promise.all([
        getUserRelationships(u.id),
        listNotChildUsers(),
        u.gender === "Nam" ? listNotWifeUsers() : listNotHusbandUsers(),
      ]);
      const mapped: RelItem[] = (relList || []).map((r: any) => ({
        id: r.id,
        relation_type: r.relation_type,
        to_user: {
          id: r.to_user?.id,
          name: r.to_user?.name,
          gender: r.to_user?.gender,
          birthday: r.to_user?.birthday ?? null,
          death_day: r.to_user?.death_day ?? null,
          phone_number: r.to_user?.phone_number ?? null,
        },
      }));
      setRels(mapped);
      setChildOpts(childList || []);
      setSpouseOpts(spouseList || []);
    } catch (e: any) {
      setLocalNotice({
        title: "Lỗi",
        message: `Tải mối quan hệ thất bại: ${e?.message || e}`,
      });
    }
  }

  // load activities (giữ nguyên)
  React.useEffect(() => {
    if (tab !== "activities" || loadedActivities) return;
    (async () => {
      try {
        const items = await getActivities(u.id);
        const normalized = items.map((x) => ({
          id: x.id,
          start_date: x.start_date ?? "",
          end_date: x.end_date ?? "",
          position: x.position ?? "",
          reward: x.reward ?? "",
          description: x.description ?? "",
        }));
        setU((prev) => ({
          ...prev,
          activities:
            normalized.length > 0
              ? normalized
              : [
                  {
                    start_date: "",
                    end_date: "",
                    position: "",
                    reward: "",
                    description: "",
                  },
                ],
        }));
        setOriginalActivities(normalized);
        setLoadedActivities(true);
      } catch (e: any) {
        setLocalNotice({
          title: "Lỗi",
          message: `Tải danh sách hoạt động thất bại: ${e?.message || e}`,
        });
      }
    })();
  }, [tab, loadedActivities, u.id]);

  // load relationships khi vào tab
  React.useEffect(() => {
    if (tab !== "relations") return;
    refreshRelationshipsAndOptions();
  }, [tab, u.gender]);

  // ----- helpers -----
  function optionById(arr: UserOption[], id?: string) {
    return arr.find((o) => o.id === id);
  }
  function inExisting(kind: "Con" | "Vợ" | "Chồng", toId: string) {
    return rels.some((r) => r.relation_type === kind && r.to_user.id === toId);
  }

  // ----- commit adds on Update -----
  async function handleUpdateRelations() {
    const adds: Array<{ kind: "Con" | "Vợ" | "Chồng"; id: string }> = [];
    newChildSlots.forEach(
      (s) =>
        s.selectedId &&
        !inExisting("Con", s.selectedId) &&
        adds.push({ kind: "Con", id: s.selectedId })
    );
    newSpouseSlots.forEach(
      (s) =>
        s.selectedId &&
        !inExisting(spouseLabel, s.selectedId) &&
        adds.push({ kind: spouseLabel, id: s.selectedId })
    );

    if (adds.length === 0) {
      setLocalNotice({
        title: "Thông báo",
        message: "Không có thay đổi mới để cập nhật.",
      });
      return;
    }

    try {
      for (const a of adds) {
        await addRelationship(u.id, a.id, a.kind);
      }
      await refreshRelationshipsAndOptions();
      setNewChildSlots([]);
      setNewSpouseSlots([]);
      const msg = `Đã thêm ${adds.length} mối quan hệ.`;
      setLocalNotice({ title: "Thành công", message: msg });
      onGlobalNotice({ title: "Thành công", message: msg });
    } catch (e: any) {
      setLocalNotice({
        title: "Lỗi",
        message: `Cập nhật mối quan hệ thất bại: ${e?.message || e}`,
      });
    }
  }

  async function handleDeleteRelation(toId: string) {
    try {
      await deleteRelationship(u.id, toId);
      await refreshRelationshipsAndOptions();
      setLocalNotice({ title: "Thành công", message: `Đã xóa mối quan hệ.` });
      onGlobalNotice({
        title: "Thành công",
        message: `Xóa mối quan hệ thành công.`,
      });
    } catch (e: any) {
      setLocalNotice({
        title: "Lỗi",
        message: `Xóa mối quan hệ thất bại: ${e?.message || e}`,
      });
    }
  }

  const spouses = rels.filter(
    (r) => r.relation_type === "Vợ" || r.relation_type === "Chồng"
  );
  const children = rels.filter((r) => r.relation_type === "Con");

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

      {/* ====== INFO (giữ như cũ) ====== */}
      {tab === "info" && (
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
                <option>Admin</option>
              </select>
            </div>
          </div>
          <div className="fi" style={{ gridColumn: "1 / -1" }}>
            <label>Ảnh</label>
            <div className="control">
              <input
                placeholder="Tên file ảnh"
                value={u.photoName || ""}
                onChange={(e) => setU({ ...u, photoName: e.target.value })}
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

      {/* ====== ACTIVITIES (y nguyên) ====== */}
      {tab === "activities" && (
        <ActivitiesTab
          u={u}
          setU={setU}
          original={originalActivities}
          setOriginal={setOriginalActivities}
          setLoaded={setLoadedActivities}
          onClose={onClose}
          onLocalNotice={setLocalNotice}
        />
      )}

      {/* ====== RELATIONS (đã đổi hành vi: đợi bấm Cập nhật) ====== */}
      {tab === "relations" && (
        <div className="form">
          {/* Spouse */}
          <div className="fi" style={{ gridColumn: "1 / -1" }}>
            <label>{spouseLabel}</label>
            <div className="control" style={{ flexWrap: "wrap", gap: 8 }}>
              {spouses.map((r) => (
                <div key={r.to_user.id} className="child-chip">
                  <input
                    readOnly
                    value={r.to_user.name}
                    style={{ minWidth: 220 }}
                  />
                  <button
                    className="button"
                    title="Xem"
                    onClick={() => setViewUser(r.to_user)}
                  >
                    Xem
                  </button>
                  <button
                    className="button button--danger"
                    title="Xóa"
                    onClick={() => handleDeleteRelation(r.to_user.id)}
                  >
                    Xóa
                  </button>
                </div>
              ))}
              {newSpouseSlots.map((slot) => {
                const chosen = optionById(spouseOpts, slot.selectedId);
                return (
                  <div key={"sp-" + slot.key} className="child-chip">
                    <select
                      value={slot.selectedId || ""}
                      onChange={(e) =>
                        setNewSpouseSlots((prev) =>
                          prev.map((s) =>
                            s.key === slot.key
                              ? {
                                  ...s,
                                  selectedId: e.target.value || undefined,
                                }
                              : s
                          )
                        )
                      }
                      style={{ minWidth: 220 }}
                    >
                      <option value="">-- Chọn --</option>
                      {spouseOpts.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="button"
                      title="Xem"
                      disabled={!chosen}
                      onClick={() =>
                        chosen &&
                        setViewUser({
                          id: chosen.id,
                          name: chosen.name,
                          gender: chosen.gender,
                          birthday: chosen.birthday,
                          death_day: chosen.death_day,
                          phone_number: chosen.phone_number,
                        })
                      }
                    >
                      Xem
                    </button>
                    <button
                      className="button button--ghost button--icon"
                      title="Bỏ"
                      onClick={() =>
                        setNewSpouseSlots((s) =>
                          s.filter((x) => x.key !== slot.key)
                        )
                      }
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              <button
                className="button"
                onClick={() =>
                  setNewSpouseSlots((s) => [
                    ...s,
                    { key: (s[s.length - 1]?.key ?? 0) + 1 },
                  ])
                }
              >
                + Thêm
              </button>
            </div>
          </div>

          {/* Children */}
          <div className="fi" style={{ gridColumn: "1 / -1" }}>
            <label>Con</label>
            <div className="control" style={{ flexWrap: "wrap", gap: 8 }}>
              {children.map((r) => (
                <div key={r.to_user.id} className="child-chip">
                  <input
                    readOnly
                    value={r.to_user.name}
                    style={{ minWidth: 220 }}
                  />
                  <button
                    className="button"
                    title="Xem"
                    onClick={() => setViewUser(r.to_user)}
                  >
                    Xem
                  </button>
                  <button
                    className="button button--danger"
                    title="Xóa"
                    onClick={() => handleDeleteRelation(r.to_user.id)}
                  >
                    Xóa
                  </button>
                </div>
              ))}
              {newChildSlots.map((slot) => {
                const chosen = optionById(childOpts, slot.selectedId);
                return (
                  <div key={"ch-" + slot.key} className="child-chip">
                    <select
                      value={slot.selectedId || ""}
                      onChange={(e) =>
                        setNewChildSlots((prev) =>
                          prev.map((s) =>
                            s.key === slot.key
                              ? {
                                  ...s,
                                  selectedId: e.target.value || undefined,
                                }
                              : s
                          )
                        )
                      }
                      style={{ minWidth: 220 }}
                    >
                      <option value="">-- Chọn --</option>
                      {childOpts.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="button"
                      title="Xem"
                      disabled={!chosen}
                      onClick={() =>
                        chosen &&
                        setViewUser({
                          id: chosen.id,
                          name: chosen.name,
                          gender: chosen.gender,
                          birthday: chosen.birthday,
                          death_day: chosen.death_day,
                          phone_number: chosen.phone_number,
                        })
                      }
                    >
                      Xem
                    </button>
                    <button
                      className="button button--ghost button--icon"
                      title="Bỏ"
                      onClick={() =>
                        setNewChildSlots((s) =>
                          s.filter((x) => x.key !== slot.key)
                        )
                      }
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              <button
                className="button"
                onClick={() =>
                  setNewChildSlots((s) => [
                    ...s,
                    { key: (s[s.length - 1]?.key ?? 0) + 1 },
                  ])
                }
              >
                + Thêm
              </button>
            </div>
          </div>

          <div
            className="actions actions--center actions--even"
            style={{ marginTop: 8 }}
          >
            <button
              className="button button--primary"
              onClick={handleUpdateRelations}
            >
              Cập nhật
            </button>
            <button className="button" onClick={onClose}>
              Đóng
            </button>
          </div>

          {/* Modal xem thông tin người được chọn */}
          {viewUser && (
            <Modal
              title="Thông tin người dùng"
              onClose={() => setViewUser(null)}
            >
              <div className="form">
                <div>
                  <b>Họ tên:</b> {viewUser.name}
                </div>
                <div>
                  <b>Giới tính:</b> {viewUser.gender || "-"}
                </div>
                <div>
                  <b>Ngày sinh:</b> {viewUser.birthday || "-"}
                </div>
                <div>
                  <b>Ngày mất:</b> {viewUser.death_day || "-"}
                </div>
                <div>
                  <b>Số điện thoại:</b> {viewUser.phone_number || "-"}
                </div>
                <div
                  className="actions actions--center"
                  style={{ marginTop: 8 }}
                >
                  <button
                    className="button button--primary"
                    onClick={() => setViewUser(null)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* local notice */}
      {localNotice && (
        <Modal
          title={localNotice.title || "Thông báo"}
          onClose={() => setLocalNotice(null)}
        >
          <p>{localNotice.message}</p>
          <div className="actions actions--center" style={{ marginTop: 8 }}>
            <button
              className="button button--primary"
              onClick={() => setLocalNotice(null)}
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ====== Activities Tab (giữ nguyên hành vi) ====== */
function ActivitiesTab({
  u,
  setU,
  original,
  setOriginal,
  setLoaded,
  onClose,
  onLocalNotice,
}: {
  u: User;
  setU: React.Dispatch<React.SetStateAction<User>>;
  original: ActivityItem[] | undefined;
  setOriginal: (x: ActivityItem[] | undefined) => void;
  setLoaded: (v: boolean) => void;
  onClose: () => void;
  onLocalNotice: (n: { title?: string; message: string } | null) => void;
}) {
  const isEmpty = (a: ActivityItem) =>
    !(
      a?.start_date ||
      a?.end_date ||
      a?.position ||
      a?.reward ||
      a?.description
    );

  async function onSaveActivitiesDiff(
    userId: string,
    original: ActivityItem[] | undefined,
    current: ActivityItem[] | undefined
  ) {
    const toCreate = (current || []).filter(
      (a) => !a.id && !a._markedDelete && !isEmpty(a)
    );
    const toDeleteIds = (current || [])
      .filter((a) => a.id && a._markedDelete)
      .map((a) => a.id!) as string[];

    let created = 0,
      deleted = 0;
    try {
      if (toCreate.length) {
        await addActivities(
          userId,
          toCreate.map((x) => ({
            start_date: x.start_date || null,
            end_date: x.end_date || null,
            description: x.description || null,
            position: x.position || null,
            reward: x.reward || null,
          }))
        );
        created = toCreate.length;
      }
      if (toDeleteIds.length) {
        await deleteActivities(toDeleteIds);
        deleted = toDeleteIds.length;
      }
      onLocalNotice({
        title: "Thành công",
        message: `Đã cập nhật hoạt động: thêm ${created}, xoá ${deleted}.`,
      });
    } catch (e: any) {
      onLocalNotice({
        title: "Lỗi",
        message: `Lưu hoạt động thất bại: ${e?.message || e}`,
      });
    }
  }

  return (
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
        ).map((a, i) => {
          const mark = !!(a as any)._markedDelete;
          return (
            <div key={a.id || i} className={cx("row", mark && "row--deleted")}>
              <div className="field">
                <label>Ngày bắt đầu</label>
                <div className="date-cell control control--with-clear">
                  <input
                    type="date"
                    value={a.start_date || ""}
                    disabled={mark}
                    onChange={(e) => {
                      const next = [...(u.activities || [])];
                      next[i] = { ...a, start_date: e.target.value };
                      setU({ ...u, activities: next });
                    }}
                  />
                  <button
                    className="button button--ghost button--icon clear-btn"
                    title="Xóa ngày bắt đầu"
                    disabled={mark}
                    onClick={() => {
                      const next = [...(u.activities || [])];
                      next[i] = { ...a, start_date: "" };
                      setU({ ...u, activities: next });
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="field">
                <label>Ngày kết thúc</label>
                <div className="date-cell control control--with-clear">
                  <input
                    type="date"
                    value={a.end_date || ""}
                    disabled={mark}
                    onChange={(e) => {
                      const next = [...(u.activities || [])];
                      next[i] = { ...a, end_date: e.target.value };
                      setU({ ...u, activities: next });
                    }}
                  />
                  <button
                    className="button button--ghost button--icon clear-btn"
                    title="Xóa ngày kết thúc"
                    disabled={mark}
                    onClick={() => {
                      const next = [...(u.activities || [])];
                      next[i] = { ...a, end_date: "" };
                      setU({ ...u, activities: next });
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="field">
                <label>Chức vụ</label>
                <input
                  placeholder="Chức vụ"
                  value={a.position || ""}
                  disabled={mark}
                  onChange={(e) => {
                    const next = [...(u.activities || [])];
                    next[i] = { ...a, position: e.target.value };
                    setU({ ...u, activities: next });
                  }}
                />
              </div>

              <div className="field">
                <label>Khen thưởng</label>
                <input
                  placeholder="Khen thưởng"
                  value={a.reward || ""}
                  disabled={mark}
                  onChange={(e) => {
                    const next = [...(u.activities || [])];
                    next[i] = { ...a, reward: e.target.value };
                    setU({ ...u, activities: next });
                  }}
                />
              </div>

              <div className="field">
                <label>Mô tả</label>
                <textarea
                  placeholder="Mô tả"
                  value={a.description || ""}
                  disabled={mark}
                  onChange={(e) => {
                    const next = [...(u.activities || [])];
                    next[i] = { ...a, description: e.target.value };
                    setU({ ...u, activities: next });
                  }}
                />
              </div>

              <div className="field field--actions">
                <label>&nbsp;</label>
                {a.id ? (
                  <button
                    className={cx(
                      "button button--ghost button--icon",
                      mark && "to-undo"
                    )}
                    title={mark ? "Bỏ đánh dấu xoá" : "Đánh dấu xoá"}
                    onClick={() => {
                      const next = [...(u.activities || [])];
                      next[i] = { ...(a as any), _markedDelete: !mark };
                      setU({ ...u, activities: next });
                    }}
                  >
                    {mark ? "↺" : "🗑"}
                  </button>
                ) : (
                  <button
                    className="button button--ghost button--icon"
                    title="Xóa dòng mới"
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
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="actions actions--center actions--even"
        style={{ marginTop: 8 }}
      >
        <button
          className="button button--primary"
          onClick={async () => {
            await onSaveActivitiesDiff(u.id, original, u.activities);
            onClose();
          }}
        >
          Cập nhật
        </button>
        <button className="button" onClick={onClose}>
          Đóng
        </button>
      </div>
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
            <option>Admin</option>
          </select>
        </div>
      </div>
      <div className="fi" style={{ gridColumn: "1 / -1" }}>
        <label>Ảnh</label>
        <div className="control">
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
