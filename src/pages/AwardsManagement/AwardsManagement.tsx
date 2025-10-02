// File: Awards.tsx
import * as React from "react";
import "./AwardsManagement.css";

import {
  listAwards,
  createAward,
  updateAward,
  deleteAward,
  getUsersLite,
  uploadAttachment,
  parseAttachment,
  type AwardDto,
  type AwardCreateRequest,
  type AwardUpdateRequest,
  type UserLite,
  type AwardUser,
} from "./awardsApi";

/* ===== Utils ===== */
function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}
const fmtVND = (n: number) =>
  (isNaN(n) ? "0" : n.toLocaleString("vi-VN")) + "₫";
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

/* ===== Modals ===== */
function BaseModal({
  title,
  onClose,
  children,
  closeOnBackdrop = true,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** cho phép chặn đóng khi click nền */
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

/* ===== Searchable single select (typeahead) ===== */
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: UserLite[];
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [highlight, setHighlight] = React.useState<number>(-1);

  // sync label theo value
  React.useEffect(() => {
    const sel = options.find((o) => o.id === value);
    setInputValue(sel?.name ?? "");
  }, [value, options]);

  const filtered = React.useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name?.toLowerCase().includes(q));
  }, [options, inputValue]);

  // đóng khi click ngoài combobox
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
        const sel = options.find((o) => o.id === value);
        if (sel && inputValue !== sel.name) setInputValue(sel.name);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [options, value, inputValue]);

  const commit = (opt: UserLite) => {
    onChange(opt.id);
    setInputValue(opt.name || "");
    setOpen(false);
    setHighlight(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min((h < 0 ? -1 : h) + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max((h < 0 ? filtered.length : h) - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = highlight >= 0 ? highlight : 0;
      if (filtered[idx]) commit(filtered[idx]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="combo" ref={wrapperRef}>
      <input
        ref={inputRef}
        className="combo-input"
        placeholder={placeholder || "Chọn họ tên..."}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      <div
        className={cx("combo-arrow", open && "open")}
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
      />
      {open && (
        <div className="combo-menu">
          {filtered.length === 0 ? (
            <div className="combo-empty">Không có kết quả</div>
          ) : (
            filtered.map((opt, idx) => (
              <div
                key={opt.id}
                className={cx("combo-item", idx === highlight && "active")}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(opt);
                }}
                onMouseEnter={() => setHighlight(idx)}
              >
                {opt.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ===== Add / Edit Modal ===== */
function AwardFormModal({
  title,
  users,
  initial,
  onSave,
  onClose,
  onViewUser,
}: {
  title: string;
  users: UserLite[];
  initial?: Partial<AwardDto>;
  onSave: (payload: AwardCreateRequest | AwardUpdateRequest) => void;
  onClose: () => void;
  onViewUser: (id: string) => void;
}) {
  const [content, setContent] = React.useState(initial?.content ?? "");
  const [userId, setUserId] = React.useState<string>(initial?.user?.id ?? "");
  const [amountStr, setAmountStr] = React.useState<string>(() => {
    const v = initial?.amount;
    return v == null ? "" : String(typeof v === "string" ? Number(v) : v);
  });
  const [otherReward, setOtherReward] = React.useState(
    initial?.other_reward ?? ""
  );
  const [awardDate, setAwardDate] = React.useState(initial?.award_date ?? "");
  const [fileAttachment, setFileAttachment] = React.useState<
    string | undefined
  >(initial?.file_attachment ?? undefined);
  const [uploading, setUploading] = React.useState(false);

  // mặc định khi tạo mới: status = "Chờ duyệt", is_highlight = false
  const defaultStatus = initial?.status ?? "Chờ duyệt";
  const defaultHighlight = initial?.is_highlight ?? false;

  const parsedAmount = Number(String(amountStr).replaceAll(",", ""));
  const canSave =
    content.trim() !== "" &&
    userId &&
    !Number.isNaN(parsedAmount) &&
    awardDate !== "";

  const doUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAttachment(file);
      setFileAttachment(`${res.originalname},${res.filename}`);
    } finally {
      setUploading(false);
    }
  };

  const att = parseAttachment(fileAttachment);

  return (
    // ✅ không đóng khi click nền
    <BaseModal title={title} onClose={onClose} closeOnBackdrop={false}>
      <div className="form">
        <div className="row">
          <div className="fi">
            <label>Họ tên</label>
            <div className="hstack">
              <SearchableSelect
                options={users}
                value={userId}
                onChange={setUserId}
                placeholder="Nhập để tìm và chọn…"
              />
              <button
                className="button"
                disabled={!userId}
                onClick={() => userId && onViewUser(userId)}
              >
                Xem thông tin
              </button>
            </div>
          </div>
          {/* ĐÃ BỎ: Trạng thái */}
        </div>

        <div className="row">
          <div className="fi">
            <label>Nội dung khen thưởng</label>
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung…"
            />
          </div>
          <div className="fi">
            <label>Phần thưởng (VND)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="row">
          <div className="fi">
            <label>Phần thưởng khác</label>
            <input
              value={otherReward}
              onChange={(e) => setOtherReward(e.target.value)}
              placeholder="Quà tặng khác (nếu có)…"
            />
          </div>
          <div className="fi">
            <label>Ngày</label>
            <input
              type="date"
              value={awardDate}
              onChange={(e) => setAwardDate(e.target.value)}
            />
          </div>
        </div>

        <div className="row">
          <div className="fi">
            <label>Tài liệu đính kèm</label>
            <div className="hstack">
              <input
                type="file"
                onChange={(e) => doUpload(e.currentTarget.files?.[0] ?? null)}
                disabled={uploading}
              />
              {att ? (
                <a
                  className="link"
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {att.name}
                </a>
              ) : (
                <span className="hint">
                  {uploading ? "Đang tải..." : "Chưa chọn tài liệu"}
                </span>
              )}
              {fileAttachment && (
                <button
                  className="button"
                  onClick={() => setFileAttachment(undefined)}
                >
                  Xóa file
                </button>
              )}
            </div>
          </div>
          {/* ĐÃ BỎ: Nổi bật */}
        </div>

        <div className="modal-footer-center">
          <button
            className="button button--primary"
            disabled={!canSave}
            onClick={() =>
              onSave({
                content: content.trim(),
                userId,
                amount: Math.max(0, Math.floor(parsedAmount)),
                other_reward: otherReward.trim() || undefined,
                award_date: awardDate,
                file_attachment: fileAttachment,
                // vẫn gửi giá trị mặc định/giữ nguyên cho backend
                status: defaultStatus,
                is_highlight: defaultHighlight,
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

function UserInfoModal({
  user,
  onClose,
}: {
  user: AwardUser;
  onClose: () => void;
}) {
  return (
    <BaseModal title={`Thông tin: ${user.name}`} onClose={onClose}>
      <div className="userinfo">
        <div>
          <b>Họ tên:</b> {user.name}
        </div>
        {user.email && (
          <div>
            <b>Email:</b> {user.email}
          </div>
        )}
        {user.phone_number && (
          <div>
            <b>Điện thoại:</b> {user.phone_number}
          </div>
        )}
        {user.address && (
          <div>
            <b>Địa chỉ:</b> {user.address}
          </div>
        )}
        {user.gender && (
          <div>
            <b>Giới tính:</b> {user.gender}
          </div>
        )}
        {user.birthday && (
          <div>
            <b>Sinh nhật:</b> {user.birthday}
          </div>
        )}
      </div>
      <div className="modal-footer-center">
        <button className="button button--primary" onClick={onClose}>
          OK
        </button>
      </div>
    </BaseModal>
  );
}

/* ===== Page ===== */
type SortKey = "name" | "content" | "amount" | "status" | "date" | "highlight";
type SortDir = "asc" | "desc";

export default function Awards() {
  // filters & paging
  const [q, setQ] = React.useState("");
  const [qDebounced, setQDebounced] = React.useState("");
  const [page, setPage] = React.useState(1);
  const LIMIT = 10;

  // data
  const [list, setList] = React.useState<AwardDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  // users for select
  const [users, setUsers] = React.useState<UserLite[]>([]);
  const [userMap, setUserMap] = React.useState<Record<string, UserLite>>({});

  // ui states
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [showAdd, setShowAdd] = React.useState(false);
  const [editRow, setEditRow] = React.useState<AwardDto | null>(null);

  const [msg, setMsg] = React.useState<string | null>(null);
  const [msgBusy, setMsgBusy] = React.useState(false);

  // sort
  const [sortKey, setSortKey] = React.useState<SortKey>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  // selection for batch actions
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const selectedIds = React.useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected]
  );
  const allChecked = React.useMemo(
    () => list.length > 0 && list.every((r) => selected[r.id]),
    [list, selected]
  );

  // fetch users (once)
  React.useEffect(() => {
    (async () => {
      const us = await getUsersLite();
      setUsers(us);
      const mp: Record<string, UserLite> = {};
      us.forEach((u) => {
        mp[u.id] = u;
      });
      setUserMap(mp);
    })().catch((e) => setError(e?.message || "Lỗi tải danh sách người dùng"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce q -> qDebounced
  React.useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(q), 400);
    return () => window.clearTimeout(t);
  }, [q]);

  // khi qDebounced đổi, về trang 1
  React.useEffect(() => {
    setPage(1);
  }, [qDebounced]);

  // fetch list theo page + qDebounced
  const fetchList = React.useCallback(
    async (pageNum: number, keyword: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listAwards({
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

  // sort client-side (trên trang hiện tại)
  const sorted = React.useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      let av: any = "",
        bv: any = "";
      switch (sortKey) {
        case "name":
          av = a.user?.name || "";
          bv = b.user?.name || "";
          break;
        case "content":
          av = a.content || "";
          bv = b.content || "";
          break;
        case "amount":
          av = Number(a.amount);
          bv = Number(b.amount);
          break;
        case "status":
          av = a.status || "";
          bv = b.status || "";
          break;
        case "date":
          av = a.award_date || "";
          bv = b.award_date || "";
          break;
        case "highlight":
          av = a.is_highlight ? 1 : 0;
          bv = b.is_highlight ? 1 : 0;
          break;
      }
      const cmp =
        sortKey === "amount" || sortKey === "highlight"
          ? (av as number) - (bv as number)
          : String(av).localeCompare(String(bv));
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

  // CRUD handlers
  const onCreate = async (payload: AwardCreateRequest | AwardUpdateRequest) => {
    await createAward(payload as AwardCreateRequest);
    setShowAdd(false);
    setPage(1);
    await fetchList(1, qDebounced);
    setMsg("Thêm khen thưởng thành công.");
  };

  const onUpdate = async (id: string, payload: AwardUpdateRequest) => {
    await updateAward(id, payload);
    setEditRow(null);
    await fetchList(page, qDebounced);
    setMsg("Cập nhật khen thưởng thành công.");
  };

  const onDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa khen thưởng này?")) return;
    await deleteAward(id);
    const newTotal = Math.max(0, total - 1);
    const newTotalPages = Math.max(1, Math.ceil(newTotal / LIMIT));
    const newPage = Math.min(page, newTotalPages);
    setPage(newPage);
    await fetchList(newPage, qDebounced);
    setMsg("Xóa khen thưởng thành công.");
  };

  // Batch actions
  const requireSelection = () => {
    if (selectedIds.length === 0) {
      setMsg("Vui lòng chọn ít nhất một bản ghi.");
      return false;
    }
    return true;
  };
  const batchUpdate = async (
    patch: AwardUpdateRequest,
    successText: string
  ) => {
    if (!requireSelection()) return;
    setMsgBusy(true);
    try {
      await Promise.allSettled(selectedIds.map((id) => updateAward(id, patch)));
      setSelected({});
      await fetchList(page, qDebounced);
      setMsg(successText);
    } catch (e: any) {
      setMsg(e?.message || "Có lỗi khi cập nhật.");
    } finally {
      setMsgBusy(false);
    }
  };
  const onApprove = () =>
    batchUpdate({ status: "Đã duyệt" }, "Đã phê duyệt bản ghi đã chọn.");
  const onReject = () =>
    batchUpdate({ status: "Từ chối" }, "Đã từ chối bản ghi đã chọn.");
  const onHighlight = () =>
    batchUpdate({ is_highlight: true }, "Đã đặt Nổi bật cho bản ghi đã chọn.");
  const onUnhighlight = () =>
    batchUpdate({ is_highlight: false }, "Đã bỏ Nổi Bật cho bản ghi đã chọn.");

  // user info modal
  const [viewUser, setViewUser] = React.useState<AwardUser | null>(null);
  const handleViewUser = (id: string) => {
    const u = userMap[id];
    if (u) setViewUser(u as any);
  };

  // selection toggles
  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) list.forEach((r) => (next[r.id] = true));
    setSelected(next);
  };
  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: checked }));
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
    <div className="awards-wrap">
      <div className="acard shadow-card">
        <div className="page-head">
          <div className="page-title">Quản lý khen thưởng</div>
          <div style={{ marginLeft: "auto", opacity: 0.9 }}>
            Trang {totalPages ? current : 0}/{totalPages} • Tổng {total} bản ghi
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-group">
            <label htmlFor="searchAwards" className="search-label">
              Tìm kiếm
            </label>
            <input
              id="searchAwards"
              className="search"
              placeholder="Tìm theo họ tên / nội dung…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="batch" style={{ display: "flex", gap: 8 }}>
            <button
              className="button"
              disabled={selectedIds.length === 0 || msgBusy}
              onClick={onApprove}
            >
              Phê duyệt
            </button>
            <button
              className="button"
              disabled={selectedIds.length === 0 || msgBusy}
              onClick={onReject}
            >
              Từ chối
            </button>
            <button
              className="button"
              disabled={selectedIds.length === 0 || msgBusy}
              onClick={onHighlight}
            >
              Nổi bật
            </button>
            <button
              className="button"
              disabled={selectedIds.length === 0 || msgBusy}
              onClick={onUnhighlight}
            >
              Bỏ Nổi Bật
            </button>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <button
              className="button button--primary"
              onClick={() => setShowAdd(true)}
            >
              + Thêm khen thưởng
            </button>
          </div>
        </div>

        {error && <div className="search-empty-banner">{error}</div>}
        {loading && <div className="count">Đang tải…</div>}

        <div className="thead">Danh sách khen thưởng</div>

        <div className="list" role="list">
          {!isNoData && (
            <div
              className="awards-tr tr--head"
              role="presentation"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="th checkbox-cell">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </div>
              <div className="th" onClick={() => toggleSort("name")}>
                Họ tên{renderSort(sortKey === "name", sortDir)}
              </div>
              <div className="th" onClick={() => toggleSort("content")}>
                Nội dung khen thưởng{renderSort(sortKey === "content", sortDir)}
              </div>
              <div className="th" onClick={() => toggleSort("amount")}>
                Phần thưởng{renderSort(sortKey === "amount", sortDir)}
              </div>
              <div className="th">Phần thưởng khác</div>
              <div className="th" onClick={() => toggleSort("status")}>
                Trạng thái{renderSort(sortKey === "status", sortDir)}
              </div>
              <div className="th" onClick={() => toggleSort("date")}>
                Ngày{renderSort(sortKey === "date", sortDir)}
              </div>
              <div className="th">Tài liệu đính kèm</div>
              <div className="th" onClick={() => toggleSort("highlight")}>
                Nổi bật{renderSort(sortKey === "highlight", sortDir)}
              </div>
              <div style={{ textAlign: "right" }}>Thao tác</div>
            </div>
          )}

          {sorted.map((r) => {
            const att = parseAttachment(r.file_attachment);
            return (
              <div key={r.id} className="awards-tr" role="listitem">
                <div className="td checkbox-cell">
                  <input
                    type="checkbox"
                    checked={!!selected[r.id]}
                    onChange={(e) => toggleOne(r.id, e.target.checked)}
                  />
                </div>
                <div className="td td--name">{r.user?.name || "—"}</div>
                <div className="td">{r.content || "—"}</div>
                <div className="td">{fmtVND(Number(r.amount))}</div>
                <div className="td">{r.other_reward || "—"}</div>
                <div className="td">{r.status || "—"}</div>
                <div className="td">{r.award_date || "—"}</div>
                <div className="td">
                  {att ? (
                    <a
                      className="link"
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {att.name}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
                <div className="td">{r.is_highlight ? "Có" : "Không"}</div>
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
            );
          })}
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
        <AwardFormModal
          title="Thêm khen thưởng"
          users={users}
          onSave={onCreate}
          onClose={() => setShowAdd(false)}
          onViewUser={handleViewUser}
        />
      )}
      {editRow && (
        <AwardFormModal
          title="Sửa khen thưởng"
          users={users}
          initial={editRow}
          onSave={(payload) => onUpdate(editRow.id, payload)}
          onClose={() => setEditRow(null)}
          onViewUser={handleViewUser}
        />
      )}
      {viewUser && (
        <UserInfoModal
          user={viewUser as any}
          onClose={() => setViewUser(null)}
        />
      )}
      {msg && <MessageModal message={msg} onClose={() => setMsg(null)} />}
    </div>
  );
}
