// File: Finance.tsx
import * as React from "react";
import "./Finance.css";

import {
  listFinances,
  createFinance,
  updateFinance,
  deleteFinance,
  exportFinancesExcel, // NEW
  type FinanceDto,
  type FinanceCreateRequest,
  type FinanceUpdateRequest,
} from "../../api/financeApi";

/* ===== Utils ===== */
function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}
const fmtVND = (n: number) =>
  (isNaN(n) ? "0" : n.toLocaleString("vi-VN")) + "₫";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Phân trang kiểu Users
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
    ) {
      pages.push(i);
    }
    if (current + window < total - 1) pages.push("…");
    pages.push(total);
  }
  return pages;
}

/* ===== Modal (Create/Edit) ===== */
function TxModal({
  initial,
  onSave,
  onClose,
  title,
}: {
  initial?: Partial<FinanceDto>;
  onSave: (payload: FinanceCreateRequest | FinanceUpdateRequest) => void;
  onClose: () => void;
  title: string;
}) {
  const [desc, setDesc] = React.useState<string>(initial?.description ?? "");
  const [type, setType] = React.useState<"Thu" | "Chi">(initial?.type ?? "Thu");
  const [amountStr, setAmountStr] = React.useState<string>(() => {
    const v = initial?.amount;
    if (v == null) return "";
    const num = typeof v === "string" ? Number(v) : v;
    return String(num ?? "");
  });
  const [date, setDate] = React.useState<string>(initial?.finance_date ?? "");

  const parsedAmount = Number(String(amountStr).replaceAll(",", ""));
  const canSave =
    type !== undefined &&
    date !== "" &&
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    (desc || "").trim() !== "";

  return (
    <div className="modal-backdrop">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="button button--ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form">
            <div className="row">
              <div className="fi">
                <label>Tên khoản</label>
                <input
                  placeholder="VD: Thu tiền họ nhà A"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>
              <div className="fi">
                <label>Loại</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "Thu" | "Chi")}
                >
                  <option value="Thu">Thu</option>
                  <option value="Chi">Chi</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div className="fi">
                <label>Số tiền (VND)</label>
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
              <div className="fi">
                <label>Ngày</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer cố định: nút căn giữa, gần đáy */}
        <div className="modal-footer">
          <button
            className="button button--primary"
            disabled={!canSave}
            onClick={() =>
              onSave({
                type,
                finance_date: date,
                amount: Math.max(0, Math.floor(parsedAmount)),
                description: desc.trim(),
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
    </div>
  );
}

/* ===== Page ===== */
type SortKey = "name" | "type" | "amount" | "date";
type SortDir = "asc" | "desc";

export default function Finance() {
  const [list, setList] = React.useState<FinanceDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const LIMIT = 10;

  // Filters
  const [q, setQ] = React.useState(""); // search theo tên (description)
  const [typeFilter, setTypeFilter] = React.useState<"" | "Thu" | "Chi">(""); // selectbox

  const [sortKey, setSortKey] = React.useState<SortKey>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const [showAdd, setShowAdd] = React.useState(false);
  const [editTx, setEditTx] = React.useState<FinanceDto | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [exporting, setExporting] = React.useState(false);

  const fetchList = React.useCallback(
    async (pageNum: number, keyword: string, typeSel: "" | "Thu" | "Chi") => {
      setLoading(true);
      setError(null);
      try {
        const res = await listFinances({
          page: pageNum,
          limit: LIMIT,
          search: keyword,
          type: typeSel,
        });
        setList(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } catch (e: any) {
        setError(e?.message || "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const debRef = React.useRef<number | undefined>(undefined);
  const triggerSearch = React.useCallback(
    (kw: string, typeSel: "" | "Thu" | "Chi") => {
      if (debRef.current) window.clearTimeout(debRef.current);
      debRef.current = window.setTimeout(() => {
        setPage(1);
        fetchList(1, kw, typeSel);
      }, 400);
    },
    [fetchList]
  );

  React.useEffect(() => {
    fetchList(page, q, typeFilter);
  }, [page]);
  React.useEffect(() => {
    triggerSearch(q, typeFilter);
  }, [q, typeFilter, triggerSearch]);

  const sorted = React.useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case "name":
          av = a.description || "";
          bv = b.description || "";
          break;
        case "type":
          av = a.type;
          bv = b.type;
          break;
        case "amount":
          av = Number(a.amount);
          bv = Number(b.amount);
          break;
        case "date":
          av = a.finance_date || "";
          bv = b.finance_date || "";
          break;
      }
      const cmp =
        sortKey === "amount"
          ? (av as number) - (bv as number)
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [list, sortKey, sortDir]);

  const current = Math.min(page, totalPages);
  const isNoData = total === 0;
  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  // CRUD handlers
  const onCreate = async (payload: FinanceCreateRequest) => {
    await createFinance(payload);
    setShowAdd(false);
    setPage(1);
    fetchList(1, q, typeFilter);
  };
  const onUpdate = async (id: string, payload: FinanceUpdateRequest) => {
    await updateFinance(id, payload);
    setEditTx(null);
    fetchList(page, q, typeFilter);
  };
  const onDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xoá khoản thu/chi này?")) return;
    await deleteFinance(id);
    const newTotal = Math.max(0, total - 1);
    const newTotalPages = Math.max(1, Math.ceil(newTotal / LIMIT));
    const newPage = Math.min(page, newTotalPages);
    setPage(newPage);
    fetchList(newPage, q, typeFilter);
  };

  // === NEW: gọi API backend để tải file Excel ===
  const exportExcelServer = async () => {
    try {
      setExporting(true);
      const blob = await exportFinancesExcel({ search: q, type: typeFilter });
      const filename = `finances_${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-")}.xlsx`;
      downloadBlob(blob, filename);
    } catch (e: any) {
      alert(e?.message || "Tải Excel thất bại");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="finance-wrap">
      <div className="acard shadow-card">
        <div className="page-head">
          <div className="page-title">Quản lý thu chi</div>
        </div>

        <div className="toolbar">
          <div className="search-group">
            <label htmlFor="searchInput" className="search-label">
              Tìm kiếm
            </label>
            <input
              id="searchInput"
              className="search"
              placeholder="Tìm theo tên khoản…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="type-group">
            <label htmlFor="typeSelect" className="type-label">
              Chọn loại
            </label>
            <select
              id="typeSelect"
              className="type-select"
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "" | "Thu" | "Chi")
              }
              title="Lọc theo loại"
            >
              <option value="">Tất cả</option>
              <option value="Thu">Thu</option>
              <option value="Chi">Chi</option>
            </select>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              className="button"
              onClick={exportExcelServer}
              disabled={exporting}
            >
              {exporting ? "Đang tải…" : "⬇️ Tải xuống Excel"}
            </button>
            <button
              className="button button--primary"
              onClick={() => setShowAdd(true)}
            >
              + Thêm khoản thu/chi
            </button>
          </div>
        </div>

        {error && <div className="search-empty-banner">{error}</div>}
        {loading && <div className="count">Đang tải…</div>}

        <div className="thead">Kết quả</div>
        <div style={{ marginLeft: "auto", opacity: 0.9 }}>
          Trang {totalPages ? current : 0}/{totalPages} • Tổng {total} bản ghi
        </div>
        {/* List */}
        <div className="list" role="list">
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
              <div style={{ textAlign: "right" }}>Thao tác</div>
            </div>
          )}

          {sorted.map((t) => {
            const amountNum = Number(t.amount);
            return (
              <div
                key={t.id}
                className={cx(
                  "finance-tr",
                  t.type === "Thu" && "tr--income",
                  t.type === "Chi" && "tr--expense"
                )}
                role="listitem"
              >
                <div className="td td--name">{t.description ?? "-"}</div>
                <div className="td td--type">{t.type}</div>
                <div className="td td--amount">{fmtVND(amountNum)}</div>
                <div className="td td--date">{t.finance_date || "-"}</div>
                <div
                  className="td td--actions"
                  style={{
                    textAlign: "right",
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  <button className="button" onClick={() => setEditTx(t)}>
                    Sửa
                  </button>
                  <button
                    className="button button--danger"
                    onClick={() => onDelete(t.id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>

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
          onSave={onCreate}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editTx && (
        <TxModal
          title="Sửa khoản thu/chi"
          initial={editTx}
          onSave={(payload) => onUpdate(editTx.id, payload)}
          onClose={() => setEditTx(null)}
        />
      )}
    </div>
  );
}
