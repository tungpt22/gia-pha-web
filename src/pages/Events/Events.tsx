// File: Events.tsx
import * as React from "react";
import "./Events.css";
import {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type EventDto,
  type EventCreateRequest,
  type EventUpdateRequest,
} from "./eventsApi.ts";

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
    )
      pages.push(i);
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
  closeOnBackdrop = false, // mặc định KHÔNG đóng khi click nền (an toàn nhập liệu)
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
function EventFormModal({
  title,
  initial,
  onSave,
  onClose,
}: {
  title: string;
  initial?: Partial<EventDto>;
  onSave: (payload: EventCreateRequest | EventUpdateRequest) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [eventDate, setEventDate] = React.useState(initial?.event_date ?? "");
  const [location, setLocation] = React.useState(initial?.location ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? ""
  );

  const canSave = name.trim() !== "" && eventDate !== "";

  return (
    <BaseModal title={title} onClose={onClose} closeOnBackdrop={false}>
      <div className="form">
        <div className="row">
          <div className="fi">
            <label>Tên sự kiện</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên sự kiện…"
            />
          </div>
          <div className="fi">
            <label>Ngày</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
        </div>

        <div className="row">
          <div className="fi">
            <label>Địa điểm</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Nhập địa điểm…"
            />
          </div>
          <div className="fi">
            <label>Mô tả</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả (tuỳ chọn)…"
            />
          </div>
        </div>

        <div className="modal-footer-center">
          <button
            className="button button--primary"
            disabled={!canSave}
            onClick={() =>
              onSave({
                name: name.trim(),
                event_date: eventDate,
                location: location.trim() || undefined,
                description: description.trim() || undefined,
              })
            }
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
type SortKey = "name" | "date" | "location" | "description";
type SortDir = "asc" | "desc";

export default function Events() {
  // filters & paging
  const [q, setQ] = React.useState("");
  const [qDebounced, setQDebounced] = React.useState("");
  const [page, setPage] = React.useState(1);
  const LIMIT = 10;

  // data
  const [list, setList] = React.useState<EventDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  // ui
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const [editRow, setEditRow] = React.useState<EventDto | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  // sort
  const [sortKey, setSortKey] = React.useState<SortKey>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  // debounce q -> qDebounced
  React.useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(q), 400);
    return () => window.clearTimeout(t);
  }, [q]);

  React.useEffect(() => {
    setPage(1);
  }, [qDebounced]);

  const fetchList = React.useCallback(
    async (pageNum: number, keyword: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listEvents({
          page: pageNum,
          limit: LIMIT,
          search: keyword,
        });
        const dt = res.data;
        setList(dt.data);
        setTotal(dt.total);
        setTotalPages(Math.max(1, Math.ceil(dt.total / dt.limit)));
      } catch (e: any) {
        setError(e?.message || "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    },
    []
  );
  React.useEffect(() => {
    fetchList(page, qDebounced);
  }, [page, qDebounced, fetchList]);

  const sorted = React.useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      let av: any = "",
        bv: any = "";
      switch (sortKey) {
        case "name":
          av = a.name || "";
          bv = b.name || "";
          break;
        case "date":
          av = a.event_date || "";
          bv = b.event_date || "";
          break;
        case "location":
          av = a.location || "";
          bv = b.location || "";
          break;
        case "description":
          av = a.description || "";
          bv = b.description || "";
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
  const onCreate = async (payload: EventCreateRequest) => {
    await createEvent(payload);
    setShowAdd(false);
    setPage(1);
    await fetchList(1, qDebounced);
    setMsg("Thêm sự kiện thành công.");
  };

  const onUpdate = async (id: string, payload: EventUpdateRequest) => {
    await updateEvent(id, payload);
    setEditRow(null);
    await fetchList(page, qDebounced);
    setMsg("Cập nhật sự kiện thành công.");
  };

  const onDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa sự kiện này?")) return;
    await deleteEvent(id);
    const newTotal = Math.max(0, total - 1);
    const newTotalPages = Math.max(1, Math.ceil(newTotal / LIMIT));
    const newPage = Math.min(page, newTotalPages);
    setPage(newPage);
    await fetchList(newPage, qDebounced);
    setMsg("Xóa sự kiện thành công.");
  };

  const current = Math.min(page, totalPages);
  const isNoData = total === 0;
  const renderSort = (active: boolean, dir: SortDir) => (
    <span className={cx("sort-icons", active && "on")}>
      <i>▲</i>
      <i>▼</i>
    </span>
  );

  return (
    <div className="events-wrap">
      <div className="ecard shadow-card">
        <div className="page-head">
          <div className="page-title">Quản lý sự kiện</div>
          <div style={{ marginLeft: "auto", opacity: 0.9 }}>
            Trang {totalPages ? current : 0}/{totalPages} • Tổng {total} bản ghi
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-group">
            <label htmlFor="searchEvents" className="search-label">
              Tìm kiếm
            </label>
            <input
              id="searchEvents"
              className="search"
              placeholder="Tìm theo tên sự kiện…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div style={{ marginLeft: "auto" }}>
            <button
              className="button button--primary"
              onClick={() => setShowAdd(true)}
            >
              + Thêm sự kiện
            </button>
          </div>
        </div>

        {error && <div className="search-empty-banner">{error}</div>}
        {loading && <div className="count">Đang tải…</div>}

        <div className="thead">Danh sách sự kiện</div>

        <div className="list" role="list">
          {!isNoData && (
            <div
              className="events-tr tr--head"
              role="presentation"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="th" onClick={() => toggleSort("name")}>
                Tên sự kiện{renderSort(sortKey === "name", sortDir)}
              </div>
              <div className="th" onClick={() => toggleSort("date")}>
                Ngày{renderSort(sortKey === "date", sortDir)}
              </div>
              <div className="th" onClick={() => toggleSort("location")}>
                Địa điểm{renderSort(sortKey === "location", sortDir)}
              </div>
              <div className="th" onClick={() => toggleSort("description")}>
                Mô tả{renderSort(sortKey === "description", sortDir)}
              </div>
              <div style={{ textAlign: "right" }}>Thao tác</div>
            </div>
          )}

          {sorted.map((r) => (
            <div key={r.id} className="events-tr" role="listitem">
              <div className="td td--name">{r.name || "—"}</div>
              <div className="td">{r.event_date || "—"}</div>
              <div className="td">{r.location || "—"}</div>
              <div className="td">{r.description || "—"}</div>
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
        <EventFormModal
          title="Thêm sự kiện"
          onSave={onCreate}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editRow && (
        <EventFormModal
          title="Sửa sự kiện"
          initial={editRow}
          onSave={(payload) => onUpdate(editRow.id, payload)}
          onClose={() => setEditRow(null)}
        />
      )}
      {msg && <MessageModal message={msg} onClose={() => setMsg(null)} />}
    </div>
  );
}
