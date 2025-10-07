// NotiManagement.tsx
import * as React from "react";
import "./NotiManagement.css";
import {
  listNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  type NotiDto,
  type NotiCreateRequest,
  type NotiUpdateRequest,
} from "./notiApi";

/* ===== Utils ===== */
function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}
const buildPageList = (totalPages: number, current: number) => {
  const pages: (number | string)[] = [];
  const w = 1;
  if (totalPages <= 7) for (let i = 1; i <= totalPages; i++) pages.push(i);
  else {
    pages.push(1);
    if (current - w > 2) pages.push("…");
    for (
      let i = Math.max(2, current - w);
      i <= Math.min(totalPages - 1, current + w);
      i++
    ) {
      pages.push(i);
    }
    if (current + w < totalPages - 1) pages.push("…");
    pages.push(totalPages);
  }
  return pages;
};

/* ===== Modal Base ===== */
function BaseModal({
  title,
  onClose,
  children,
  closeOnBackdrop = false, // KHÔNG đóng khi click nền (tránh mất dữ liệu)
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
}) {
  return (
    <div
      className="modal-backdrop"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="button button--ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function MessageModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Thông báo</div>
        </div>
        <div className="modal-body">
          <div className="msg">{message}</div>
          <div className="modal-footer-center">
            <button className="button button--primary" onClick={onClose}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Add / Edit Modal ===== */
/** withTypeSelector: bật để có select "Chọn loại" và ghép prefix vào title khi Lưu */
function NotiFormModal({
  title,
  initial,
  onSave,
  onClose,
  withTypeSelector = false,
}: {
  title: string;
  initial?: Partial<NotiDto>;
  onSave: (payload: NotiCreateRequest | NotiUpdateRequest) => void;
  onClose: () => void;
  withTypeSelector?: boolean;
}) {
  // Nếu có select loại và initial.title có prefix hợp lệ -> tách ra để bind sẵn
  const parsePrefixed = (t: string) => {
    const m = t.match(/^\s*\[(Thư mời|Ngày giỗ|Cáo phó)\]\s*(.*)$/);
    if (!m) return null;
    return {
      cate: m[1] as "Thư mời" | "Ngày giỗ" | "Cáo phó",
      base: m[2] || "",
    };
  };
  const parsed =
    withTypeSelector && initial?.title ? parsePrefixed(initial.title) : null;

  // NEW: chọn loại dùng cho cả Thêm & Sửa (nếu withTypeSelector = true)
  const [cate, setCate] = React.useState<"Thư mời" | "Ngày giỗ" | "Cáo phó">(
    parsed?.cate ?? "Thư mời"
  );

  const [ntitle, setNtitle] = React.useState(
    parsed?.base ?? initial?.title ?? ""
  );
  const [content, setContent] = React.useState(initial?.content ?? "");

  const canSave = ntitle.trim() !== "" && content.trim() !== "";

  const handleSave = () => {
    const rawTitle = ntitle.trim();
    const finalTitle = withTypeSelector ? `[${cate}] ${rawTitle}` : rawTitle; // GHÉP PREFIX
    onSave({ title: finalTitle, content: content.trim() });
  };

  return (
    <BaseModal title={title} onClose={onClose} closeOnBackdrop={false}>
      <div className="form">
        <div className="row">
          <div className="fi">
            <label>Tiêu đề</label>
            <input
              value={ntitle}
              onChange={(e) => setNtitle(e.target.value)}
              placeholder="Nhập tiêu đề…"
            />
          </div>

          {/* Select Chọn loại – dùng cho cả Thêm và Sửa khi withTypeSelector = true */}
          {withTypeSelector && (
            <div className="fi">
              <label>Chọn loại</label>
              <select
                value={cate}
                onChange={(e) => setCate(e.target.value as any)}
              >
                <option value="Thư mời">Thư mời</option>
                <option value="Ngày giỗ">Ngày giỗ</option>
                <option value="Cáo phó">Cáo phó</option>
              </select>
            </div>
          )}
        </div>

        <div className="row">
          <div className="fi" style={{ gridColumn: "1/-1" }}>
            <label>Nội dung</label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung…"
            />
          </div>
        </div>
        <div className="modal-footer-center">
          <button
            className="button button--primary"
            disabled={!canSave}
            onClick={handleSave}
          >
            Lưu
          </button>
          <button className="button" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

/* ===== Page ===== */
type SortKey = "title" | "content" | "created_at" | "updated_at";
type SortDir = "asc" | "desc";

export default function NotiManagement() {
  // paging
  const [page, setPage] = React.useState(1);
  const LIMIT = 10;

  // data
  const [list, setList] = React.useState<NotiDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  // ui
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const [editRow, setEditRow] = React.useState<NotiDto | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  // sort
  const [sortKey, setSortKey] = React.useState<SortKey>("created_at");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const fetchList = React.useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listNotifications({ page: pageNum, limit: LIMIT });
      const dt = res.data;
      setList(dt.data);
      setTotal(dt.total);
      setTotalPages(Math.max(1, Math.ceil(dt.total / dt.limit)));
    } catch (e: any) {
      setError(e?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    fetchList(page);
  }, [page, fetchList]);

  const sorted = React.useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      let av: string = "",
        bv: string = "";
      switch (sortKey) {
        case "title":
          av = a.title || "";
          bv = b.title || "";
          break;
        case "content":
          av = a.content || "";
          bv = b.content || "";
          break;
        case "created_at":
          av = a.created_at || "";
          bv = b.created_at || "";
          break;
        case "updated_at":
          av = a.updated_at || "";
          bv = b.updated_at || "";
          break;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [list, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  // CRUD
  const onCreate = async (payload: NotiCreateRequest) => {
    await createNotification(payload);
    setShowAdd(false);
    setPage(1);
    await fetchList(1);
    setMsg("Thêm thông báo thành công.");
  };
  const onUpdate = async (id: string, payload: NotiUpdateRequest) => {
    await updateNotification(id, payload);
    setEditRow(null);
    await fetchList(page);
    setMsg("Cập nhật thông báo thành công.");
  };
  const onDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa thông báo này?")) return;
    await deleteNotification(id);
    const newTotal = Math.max(0, total - 1);
    const newTotalPages = Math.max(1, Math.ceil(newTotal / LIMIT));
    const newPage = Math.min(page, newTotalPages);
    setPage(newPage);
    await fetchList(newPage);
    setMsg("Xóa thông báo thành công.");
  };

  const current = Math.min(page, totalPages);
  const isNoData = total === 0;
  const renderSort = (active: boolean, dir: SortDir) => (
    <span className={cx("sort-icons", active && "on")}>
      <i>▲</i>
      <i>▼</i>
    </span>
  );

  const fmtDate = (s?: string) => (s ? s.slice(0, 10) : "—");

  return (
    <div className="noti-wrap">
      <div className="ncard shadow-card">
        <div className="page-head">
          <div className="page-title">Quản lý thông báo</div>
          <div style={{ marginLeft: "auto", opacity: 0.9 }}>
            Trang {totalPages ? current : 0}/{totalPages} • Tổng {total} bản ghi
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div style={{ marginLeft: "auto" }}>
            <button
              className="button button--primary"
              onClick={() => setShowAdd(true)}
            >
              + Thêm thông báo
            </button>
          </div>
        </div>

        {error && <div className="search-empty-banner">{error}</div>}
        {loading && <div className="count">Đang tải…</div>}

        <div className="thead">Danh sách thông báo</div>

        <div className="list" role="list">
          {!isNoData && (
            <div
              className="noti-tr tr--head"
              role="presentation"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="th" onClick={() => toggleSort("title")}>
                Tiêu đề{renderSort(sortKey === "title", sortDir)}
              </div>
              <div className="th" onClick={() => toggleSort("content")}>
                Nội dung{renderSort(sortKey === "content", sortDir)}
              </div>
              <div className="th" onClick={() => toggleSort("created_at")}>
                Ngày tạo{renderSort(sortKey === "created_at", sortDir)}
              </div>
              <div className="th" onClick={() => toggleSort("updated_at")}>
                Ngày sửa đổi{renderSort(sortKey === "updated_at", sortDir)}
              </div>
              <div style={{ textAlign: "right" }}>Thao tác</div>
            </div>
          )}

          {sorted.map((r) => (
            <div key={r.id} className="noti-tr" role="listitem">
              <div className="td td--title">{r.title || "—"}</div>
              <div className="td">{r.content || "—"}</div>
              <div className="td">{fmtDate(r.created_at)}</div>
              <div className="td">{fmtDate(r.updated_at)}</div>
              <div
                className="td td--actions"
                style={{
                  textAlign: "right",
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <button className="button" onClick={() => setEditRow(r)}>
                  Sửa
                </button>
                <button
                  className="button button--danger"
                  onClick={() => onDelete(r.id)}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        {total > 0 && (
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

      {/* Modals */}
      {showAdd && (
        <NotiFormModal
          title="Thêm thông báo"
          withTypeSelector // NEW: Thêm có chọn loại
          onSave={onCreate}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editRow && (
        <NotiFormModal
          title="Sửa thông báo"
          initial={editRow}
          withTypeSelector // NEW: Sửa cũng có chọn loại & auto parse prefix
          onSave={(payload) => onUpdate(editRow.id, payload)}
          onClose={() => setEditRow(null)}
        />
      )}
      {msg && <MessageModal message={msg} onClose={() => setMsg(null)} />}
    </div>
  );
}
