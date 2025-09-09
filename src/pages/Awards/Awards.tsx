import * as React from "react";
import "./Awards.css";

/* ===== Types ===== */
type Award = {
  id: string;
  person: string; // Họ tên
  title: string; // Thành tích
  date: string; // Ngày đạt (text)
  desc?: string; // Mô tả
};

/* ===== Seed data (có thể thay bằng API) ===== */
const seed: Award[] = [
  {
    id: "k1",
    person: "Nguyễn Văn D",
    title: "Học sinh giỏi Quốc gia",
    date: "2024",
    desc: "Thành tích xuất sắc",
  },
];

/* Danh sách người dùng cho dropdown (có thể lấy từ API/props) */
const peopleOptionsSeed = [
  "Nguyễn Văn A",
  "Trần Thị Mai",
  "Nguyễn Văn D",
  "Phạm Văn Z",
  "Trần Thị D",
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

/* ===== Create/Edit Award Modal ===== */
function AwardModal({
  initial,
  peopleOptions,
  onSave,
  onClose,
  title,
}: {
  initial?: Partial<Award>;
  peopleOptions: string[];
  onSave: (aw: Award) => void;
  onClose: () => void;
  title: string;
}) {
  const [person, setPerson] = React.useState<string>(initial?.person ?? "");
  const [tt, setTt] = React.useState<string>(initial?.title ?? "");
  const [date, setDate] = React.useState<string>(initial?.date ?? "");
  const [desc, setDesc] = React.useState<string>(initial?.desc ?? "");

  const canSave =
    person.trim() !== "" && tt.trim() !== "" && date.trim() !== "";

  return (
    <Modal title={title} onClose={onClose}>
      <div className="form">
        <div className="fi">
          <label>Họ tên</label>
          <div className="control">
            <select value={person} onChange={(e) => setPerson(e.target.value)}>
              <option value="">-- Chọn người dùng --</option>
              {peopleOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="fi">
          <label>Thành tích</label>
          <div className="control">
            <input
              placeholder="VD: Học sinh giỏi, Lao động tiên tiến…"
              value={tt}
              onChange={(e) => setTt(e.target.value)}
            />
          </div>
        </div>

        <div className="fi">
          <label>Ngày đạt</label>
          <div className="control">
            <input
              placeholder="VD: 2024-05, Quý 1/2025, 12/08/2025…"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="fi" style={{ gridColumn: "1 / -1" }}>
          <label>Mô tả</label>
          <div className="control">
            <textarea
              rows={3}
              placeholder="Ghi chú thêm (không bắt buộc)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
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
            onClick={() => {
              const aw: Award = {
                id: initial?.id ?? `k_${Date.now()}`,
                person: person.trim(),
                title: tt.trim(),
                date: date.trim(),
                desc: desc.trim(),
              };
              onSave(aw); // Lưu và đóng
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

/* ===== Page ===== */
type SortKey = "person" | "title" | "date" | "desc";
type SortDir = "asc" | "desc";

export default function Awards() {
  const [list, setList] = React.useState<Award[]>(seed);
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<SortKey>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [showAdd, setShowAdd] = React.useState(false);
  const [edit, setEdit] = React.useState<Award | null>(null);

  const PAGE_SIZE = 10;

  // Dropdown options: hợp nhất từ seed và options mặc định, loại trùng
  const peopleOptions = React.useMemo(() => {
    const names = new Set<string>([
      ...peopleOptionsSeed,
      ...list.map((x) => x.person),
    ]);
    return Array.from(names);
  }, [list]);

  const filtered = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return list;
    return list.filter((k) =>
      `${k.person} ${k.title} ${k.date} ${k.desc || ""}`
        .toLowerCase()
        .includes(kw)
    );
  }, [list, q]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case "person":
          av = a.person || "";
          bv = b.person || "";
          break;
        case "title":
          av = a.title || "";
          bv = b.title || "";
          break;
        case "date":
          av = a.date || "";
          bv = b.date || "";
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

  const isNoData = total === 0; // ẩn header khi không có dữ liệu
  const isSearchEmpty = q.trim() !== "" && total === 0;

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  const addAward = (aw: Award) => {
    setList((prev) => [aw, ...prev]);
    setShowAdd(false);
  };
  const updateAward = (aw: Award) => {
    setList((prev) => prev.map((x) => (x.id === aw.id ? aw : x)));
    setEdit(null);
  };
  const remove = (id: string) =>
    setList((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="awards-wrap">
      <div className="card">
        {/* Title */}
        <div className="page-head">
          <div className="page-title">Quản lý thành tích</div>
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
              placeholder="Tìm theo họ tên, thành tích, mô tả…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="toolbar-right">
            <button
              className="button button--primary add-btn"
              onClick={() => setShowAdd(true)}
            >
              + Thêm thành tích
            </button>
          </div>
        </div>

        {isSearchEmpty && (
          <div className="search-empty-banner">Không tìm thấy kết quả</div>
        )}
        <div className="count">Tìm thấy {total} bản ghi</div>
        <div className="thead">Kết quả tìm kiếm</div>

        {/* List */}
        <div className="list" role="list">
          {/* Header (ẩn khi không có dữ liệu) */}
          {!isNoData && (
            <div
              className="awards-tr tr--head"
              role="presentation"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="th" onClick={() => toggleSort("person")}>
                <span>Họ tên</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      sortKey === "person" && sortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      sortKey === "person" && sortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSort("title")}>
                <span>Thành tích</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      sortKey === "title" && sortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      sortKey === "title" && sortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSort("date")}>
                <span>Ngày đạt</span>
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

          {paginated.map((k) => (
            <div
              key={k.id}
              className="awards-tr"
              role="listitem"
              title="Sửa thành tích"
              onClick={() => setEdit(k)}
            >
              <div className="td td--person">{k.person}</div>
              <div className="td td--title">{k.title}</div>
              <div className="td td--date">{k.date}</div>
              <div className="td td--desc">{k.desc || "-"}</div>
              <div
                className="td td--actions"
                style={{
                  textAlign: "right",
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button className="button" onClick={() => setEdit(k)}>
                  Sửa
                </button>
                <button
                  className="button button--danger"
                  onClick={() => remove(k.id)}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination (giống Thu chi/Users) */}
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

      {/* Add / Edit Modals */}
      {showAdd && (
        <AwardModal
          title="Thêm thành tích"
          peopleOptions={peopleOptions}
          onSave={addAward}
          onClose={() => setShowAdd(false)}
        />
      )}
      {edit && (
        <AwardModal
          title="Sửa thành tích"
          initial={edit}
          peopleOptions={peopleOptions}
          onSave={updateAward}
          onClose={() => setEdit(null)}
        />
      )}
    </div>
  );
}
