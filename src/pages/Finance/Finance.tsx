import * as React from "react";
import "./Finance.css";

/* ===== Types ===== */
type Tx = {
  id: string;
  name: string; // Tên khoản
  type: "Thu" | "Chi";
  amount: number; // VND
  date: string; // YYYY-MM-DD
  desc: string; // Mô tả
};

const seed: Tx[] = [
  {
    id: "t1",
    name: "Ủng hộ quỹ",
    type: "Thu",
    amount: 5_000_000,
    date: "2025-07-01",
    desc: "Đóng góp xây dựng",
  },
  {
    id: "t2",
    name: "Mua vật tư",
    type: "Chi",
    amount: 1_500_000,
    date: "2025-07-10",
    desc: "Vật tư sinh hoạt",
  },
];

/* ===== Utils ===== */
function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}
const fmtVND = (n: number) =>
  (isNaN(n) ? "0" : n.toLocaleString("vi-VN")) + "₫";

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

/* ===== Reusable Create/Edit Modal (no tabs) ===== */
function TxModal({
  initial,
  onSave,
  onClose,
  title,
}: {
  initial?: Partial<Tx>;
  onSave: (tx: Tx) => void;
  onClose: () => void;
  title: string;
}) {
  const [name, setName] = React.useState<string>(initial?.name ?? "");
  const [type, setType] = React.useState<Tx["type"]>(initial?.type ?? "Thu");
  // dùng chuỗi cho input số để tránh lỗi khi gõ/clear
  const [amountStr, setAmountStr] = React.useState<string>(
    initial?.amount != null ? String(initial.amount) : ""
  );
  const [date, setDate] = React.useState<string>(initial?.date ?? "");
  const [desc, setDesc] = React.useState<string>(initial?.desc ?? "");

  const parsedAmount = Number(amountStr.replaceAll(",", ""));
  const canSave =
    name.trim() !== "" &&
    type !== undefined &&
    date !== "" &&
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0;

  return (
    <Modal title={title} onClose={onClose}>
      <div className="form">
        <div className="fi">
          <label>Tên khoản</label>
          <div className="control">
            <input
              placeholder="VD: Tiền ủng hộ"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="fi">
          <label>Loại</label>
          <div className="control">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Tx["type"])}
            >
              <option value="Thu">Thu</option>
              <option value="Chi">Chi</option>
            </select>
          </div>
        </div>

        <div className="fi">
          <label>Số tiền (VND)</label>
          <div className="control">
            <input
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              placeholder="0"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
            />
          </div>
        </div>

        <div className="fi">
          <label>Ngày</label>
          <div className="control">
            <input
              type="date"
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
              placeholder="Nhập mô tả…"
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
              const tx: Tx = {
                id: initial?.id ?? `t_${Date.now()}`,
                name: name.trim(),
                type,
                amount: Math.max(0, Math.floor(parsedAmount)),
                date,
                desc: (desc || "").trim(),
              };
              onSave(tx); // Thêm/cập nhật và đóng
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
type SortKey = "name" | "type" | "amount" | "date" | "desc";
type SortDir = "asc" | "desc";

export default function Finance() {
  const [list, setList] = React.useState<Tx[]>(seed);
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<SortKey>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [showAdd, setShowAdd] = React.useState(false);
  const [editTx, setEditTx] = React.useState<Tx | null>(null);

  const PAGE_SIZE = 10;

  const filtered = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return list;
    return list.filter((t) =>
      `${t.name} ${t.desc} ${t.type} ${t.amount} ${t.date}`
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
        case "type":
          av = a.type;
          bv = b.type;
          break;
        case "amount":
          av = a.amount;
          bv = b.amount;
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
      const cmp =
        sortKey === "amount"
          ? (av as number) - (bv as number)
          : String(av).localeCompare(String(bv));
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

  const isNoData = total === 0; // ẩn header khi không có dữ liệu (như cũ)
  const isSearchEmpty = q.trim() !== "" && total === 0;

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  const addTx = (tx: Tx) => {
    setList((prev) => [tx, ...prev]);
    setShowAdd(false); // đóng popup sau khi Lưu
  };
  const updateTx = (tx: Tx) => {
    setList((prev) => prev.map((x) => (x.id === tx.id ? tx : x)));
    setEditTx(null); // đóng popup sửa
  };
  const remove = (id: string) =>
    setList((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="finance-wrap">
      <div className="card">
        {/* Title */}
        <div className="page-head">
          <div className="page-title">Quản lý thu chi</div>
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
              placeholder="Tìm theo tên khoản, mô tả, loại, số tiền…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="toolbar-right">
            <button
              className="button button--primary add-btn"
              onClick={() => setShowAdd(true)}
            >
              + Thêm khoản thu/chi
            </button>
          </div>
        </div>
        <div className="count">Tìm thấy {total} kết quả</div>
        <div className="thead">Kết quả tìm kiếm</div>

        {isSearchEmpty && (
          <div className="search-empty-banner">Không tìm thấy kết quả</div>
        )}

        {/* List */}
        <div className="list" role="list">
          {/* Header with sort arrows (ẩn khi không có dữ liệu) */}
          {!isNoData && (
            <div
              className="finance-tr tr--head"
              role="presentation"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="th" onClick={() => toggleSort("name")}>
                <span>Tên khoản</span>
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
              <div className="th" onClick={() => toggleSort("type")}>
                <span>Loại</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      sortKey === "type" && sortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      sortKey === "type" && sortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSort("amount")}>
                <span>Số tiền</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      sortKey === "amount" && sortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      sortKey === "amount" && sortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSort("date")}>
                <span>Ngày</span>
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

          {paginated.map((t) => (
            <div
              key={t.id}
              className={cx(
                "finance-tr",
                t.type === "Thu" && "tr--income",
                t.type === "Chi" && "tr--expense"
              )}
              role="listitem"
              title="Sửa khoản"
              onClick={() => setEditTx(t)} // click dòng để sửa
            >
              <div className="td td--name">{t.name}</div>
              <div className="td td--type">{t.type}</div>
              <div className="td td--amount">{fmtVND(t.amount)}</div>
              <div className="td td--date">{t.date || "-"}</div>
              <div className="td td--desc">{t.desc}</div>
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
                <button className="button" onClick={() => setEditTx(t)}>
                  Sửa
                </button>
                <button
                  className="button button--danger"
                  onClick={() => remove(t.id)}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination (giống Users) */}
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
        <TxModal
          title="Thêm khoản thu/chi"
          onSave={addTx}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editTx && (
        <TxModal
          title="Sửa khoản thu/chi"
          initial={editTx}
          onSave={updateTx}
          onClose={() => setEditTx(null)}
        />
      )}
    </div>
  );
}
