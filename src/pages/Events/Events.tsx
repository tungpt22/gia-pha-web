import * as React from "react";
import "./Events.css";

/* ===== Types ===== */
type EventItem = {
  id: string;
  name: string; // Tên sự kiện
  date: string; // YYYY-MM-DD
  location: string; // Địa điểm
  desc: string; // Mô tả
};

/* ===== Seed data ===== */
const seed: EventItem[] = [
  {
    id: "e1",
    name: "Hội thảo chuyển đổi số",
    date: "2025-09-20",
    location: "Hội trường lớn – Tầng 2",
    desc: "Chia sẻ kinh nghiệm triển khai chuyển đổi số trong giáo dục.",
  },
  {
    id: "e2",
    name: "Ngày hội việc làm",
    date: "2025-10-15",
    location: "Sân vận động",
    desc: "Giao lưu doanh nghiệp, tư vấn nghề nghiệp cho sinh viên.",
  },
];

/* ===== Utils ===== */
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

/* ===== Modal ===== */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
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

/* ===== Confirm Dialog ===== */
function ConfirmDialog({
  title = "Xác nhận",
  message,
  onCancel,
  onConfirm,
}: {
  title?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="confirm-msg">{message}</div>
      <div
        className="actions actions--center"
        style={{ gap: 8, marginTop: 10 }}
      >
        <button className="button" onClick={onCancel}>
          Hủy
        </button>
        <button className="button button--danger" onClick={onConfirm}>
          Xóa
        </button>
      </div>
    </Modal>
  );
}

/* ===== Create/Edit Modal ===== */
function EventModal({
  initial,
  onSave,
  onClose,
  title,
}: {
  initial?: Partial<EventItem>;
  onSave: (it: EventItem) => void;
  onClose: () => void;
  title: string;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [date, setDate] = React.useState(initial?.date ?? "");
  const [location, setLoc] = React.useState(initial?.location ?? "");
  const [desc, setDesc] = React.useState(initial?.desc ?? "");

  // FIX tại đây: thêm () cho trim()
  const canSave = name.trim() !== "" && date.trim() !== "";

  return (
    <Modal title={title} onClose={onClose}>
      <div className="form form-grid">
        <div className="fi">
          <label>Tên sự kiện</label>
          <div className="control">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên sự kiện"
            />
          </div>
        </div>

        <div className="fi">
          <label>Ngày tổ chức</label>
          <div className="control">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="fi" style={{ gridColumn: "1 / -1" }}>
          <label>Địa điểm</label>
          <div className="control">
            <textarea
              rows={2}
              value={location}
              onChange={(e) => setLoc(e.target.value)}
              placeholder="Nhập địa điểm tổ chức"
            />
          </div>
        </div>

        <div className="fi" style={{ gridColumn: "1 / -1" }}>
          <label>Mô tả</label>
          <div className="control">
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ghi chú, nội dung chi tiết…"
            />
          </div>
        </div>

        <div
          className="actions actions--center actions--even"
          style={{ gridColumn: "1 / -1" }}
        >
          <button
            className="button button--primary"
            disabled={!canSave}
            onClick={async () => {
              const item: EventItem = {
                id: initial?.id ?? `e_${Date.now()}`,
                name: name.trim(),
                date,
                location: (location || "").trim(),
                desc: (desc || "").trim(),
              };

              /* TODO: Gọi API lưu sự kiện (thay mock bằng API thật)
                 Ví dụ:
                 await fetch("/api/events", {
                   method: "POST",
                   headers: { "Content-Type": "application/json" },
                   body: JSON.stringify(item),
                 });
              */
              await mockCreateEventAPI(item);

              onSave(item); // cập nhật UI & đóng popup
            }}
          >
            Lưu
          </button>
          <button className="button" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ===== Mock API (thay bằng API thật khi tích hợp) ===== */
async function mockCreateEventAPI(payload: EventItem) {
  await new Promise((r) => setTimeout(r, 150));
  console.log("POST /api/events", payload);
}

/* ===== Page ===== */
type SortKey = "name" | "date" | "location" | "desc";
type SortDir = "asc" | "desc";

export default function Events() {
  const [list, setList] = React.useState<EventItem[]>(seed);
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<SortKey>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [showAdd, setShowAdd] = React.useState(false);
  const [edit, setEdit] = React.useState<EventItem | null>(null);
  const [view, setView] = React.useState<EventItem | null>(null);
  const [confirmTarget, setConfirmTarget] = React.useState<EventItem | null>(
    null
  );

  const PAGE_SIZE = 10;

  const filtered = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return list;
    return list.filter((it) =>
      `${it.name} ${it.date} ${it.location} ${it.desc}`
        .toLowerCase()
        .includes(kw)
    );
  }, [list, q]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case "name":
          av = a.name || "";
          bv = b.name || "";
          break;
        case "date":
          av = a.date || "";
          bv = b.date || "";
          break;
        case "location":
          av = a.location || "";
          bv = b.location || "";
          break;
        case "desc":
          av = a.desc || "";
          bv = b.desc || "";
          break;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  React.useEffect(() => {
    setPage(1);
  }, [q, sortKey, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const paginated = sorted.slice(start, start + PAGE_SIZE);

  const isNoData = total === 0;

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  const onCreate = (item: EventItem) => {
    setList((prev) => [item, ...prev]);
    setShowAdd(false);
  };
  const onUpdate = (item: EventItem) => {
    setList((prev) => prev.map((x) => (x.id === item.id ? item : x)));
    setEdit(null);
  };
  const onDelete = (id: string) =>
    setList((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="events-wrap">
      <div className="card">
        {/* Title */}
        <div className="page-head">
          <div className="page-title">Quản lý sự kiện</div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-group">
            <label htmlFor="searchInput" className="search-label">
              Tìm kiếm
            </label>
            <input
              id="searchInput"
              className="search"
              placeholder="Tìm theo tên sự kiện, địa điểm, mô tả…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="toolbar-right">
            <button
              className="button button--primary add-btn"
              onClick={() => setShowAdd(true)}
            >
              + Thêm sự kiện
            </button>
          </div>
        </div>
        <div className="count">Tìm thấy {total} kết quả</div>
        <div className="thead">Kết quả tìm kiếm</div>
        {/* Empty banner */}
        {isNoData && (
          <div className="search-empty-banner">Không tìm thấy kết quả</div>
        )}

        {/* List */}
        <div className="list" role="list">
          {!isNoData && (
            <div
              className="events-tr tr--head"
              role="presentation"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="th" onClick={() => toggleSort("name")}>
                <span>Tên sự kiện</span>
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
              <div className="th" onClick={() => toggleSort("date")}>
                <span>Ngày tổ chức</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      sortKey === "date" && sortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      sortKey === "date" && sortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSort("location")}>
                <span>Địa điểm</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      sortKey === "location" && sortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      sortKey === "location" && sortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSort("desc")}>
                <span>Mô tả</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      sortKey === "desc" && sortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      sortKey === "desc" && sortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              {/* <div style={{ textAlign: "right" }}>Thao tác</div> */}
            </div>
          )}

          {paginated.map((it) => (
            <div
              key={it.id}
              className="events-tr"
              role="listitem"
              title="Xem chi tiết"
            >
              <div
                className="td td--name"
                onClick={() => setView(it)}
                style={{ cursor: "pointer" }}
              >
                {it.name}
              </div>
              <div className="td td--date">{it.date}</div>
              <div className="td td--location">{it.location || "-"}</div>
              <div className="td td--desc">{it.desc || "-"}</div>
              <div
                className="td td--actions"
                style={{
                  textAlign: "right",
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <button className="button" onClick={() => setEdit(it)}>
                  Sửa
                </button>
                <button
                  className="button button--danger"
                  onClick={() => setConfirmTarget(it)}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {!isNoData && (
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

      {/* Popups */}
      {showAdd && (
        <EventModal
          title="Thêm sự kiện"
          onSave={onCreate}
          onClose={() => setShowAdd(false)}
        />
      )}
      {edit && (
        <EventModal
          title="Sửa sự kiện"
          initial={edit}
          onSave={onUpdate}
          onClose={() => setEdit(null)}
        />
      )}
      {view && (
        <Modal title={view.name} onClose={() => setView(null)}>
          <div className="event-view-meta">
            <div>
              <b>Ngày tổ chức:</b> {view.date}
            </div>
            <div>
              <b>Địa điểm:</b> {view.location || "-"}
            </div>
          </div>
          <div className="event-view-desc">{view.desc || "-"}</div>
        </Modal>
      )}
      {confirmTarget && (
        <ConfirmDialog
          message={`Bạn có chắc chắn muốn xóa sự kiện "${confirmTarget.name}"?`}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={() => {
            onDelete(confirmTarget.id);
            setConfirmTarget(null);
          }}
        />
      )}
    </div>
  );
}
