// File: NewsManagement.tsx
import * as React from "react";
import "./NewsManagement.css";
import {
  listNews,
  createNews,
  updateNews,
  deleteNews,
  getNews,
  uploadFile,
  toAbsoluteFileUrl,
  toAbsoluteThumbUrl,
  type NewsDto,
  type NewsCreateRequest,
  type NewsUpdateRequest,
} from "./newsApi";

/* ============== Utils ============== */
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

/* ============== Simple Modals (message / confirm / image) ============== */
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
function ConfirmModal({
  text,
  onOk,
  onCancel,
}: {
  text: string;
  onOk: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Xác nhận</div>
        </div>
        <div className="modal-body">
          <div className="msg">{text}</div>
          <div className="modal-footer-center">
            <button className="button" onClick={onCancel}>
              Hủy
            </button>
            <button className="button button--primary" onClick={onOk}>
              Đồng ý
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="image-modal" onClick={(e) => e.stopPropagation()}>
        <button className="image-close" onClick={onClose} title="Đóng">
          ×
        </button>
        <img src={src} alt="thumbnail" />
      </div>
    </div>
  );
}

/* ============== Rich Editor (contenteditable + toolbar) ============== */
function RichEditor({
  value,
  onChange,
  onUploadImage,
}: {
  value: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string>; // return absolute URL
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inputFileRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };
  const formatBlock = (tag: string) => exec("formatBlock", tag);
  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };
  const createLink = () => {
    const url = prompt("Nhập URL liên kết:");
    if (!url) return;
    exec("createLink", url);
  };
  const removeLink = () => exec("unlink");

  const handlePickImage = () => inputFileRef.current?.click();
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    try {
      const url = await onUploadImage(file);
      exec("insertImage", url);
      if (ref.current) {
        const imgs = ref.current.querySelectorAll("img");
        const last = imgs[imgs.length - 1];
        if (last) last.setAttribute("style", "max-width:100%;height:auto;");
      }
    } finally {
      e.currentTarget.value = "";
    }
  };

  return (
    <div className="editor">
      <div className="toolbar nowrap">
        {/* font family (nhỏ) */}
        <select
          className="tb tb--sm"
          onChange={(e) => exec("fontName", e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>
            Font
          </option>
          <option>Arial</option>
          <option>Times New Roman</option>
          <option>Tahoma</option>
          <option>Verdana</option>
          <option>Courier New</option>
          <option>Georgia</option>
          <option>Roboto</option>
        </select>
        {/* font size (nhỏ) */}
        <select
          className="tb tb--sm"
          onChange={(e) => exec("fontSize", e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>
            Cỡ
          </option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
        </select>
        {/* heading (nhỏ) */}
        <select
          className="tb tb--sm"
          onChange={(e) => {
            const v = e.target.value;
            if (v) formatBlock(v as any);
            e.currentTarget.value = "";
          }}
          defaultValue=""
        >
          <option value="" disabled>
            H
          </option>
          <option value="P">P</option>
          <option value="H1">H1</option>
          <option value="H2">H2</option>
          <option value="H3">H3</option>
          <option value="H4">H4</option>
          <option value="BLOCKQUOTE">BQ</option>
          <option value="PRE">PRE</option>
        </select>

        <button className="tb" title="Đậm" onClick={() => exec("bold")}>
          <b>B</b>
        </button>
        <button className="tb" title="Nghiêng" onClick={() => exec("italic")}>
          <i>I</i>
        </button>
        <button
          className="tb"
          title="Gạch chân"
          onClick={() => exec("underline")}
        >
          <u>U</u>
        </button>
        <button
          className="tb"
          title="Gạch ngang"
          onClick={() => exec("strikeThrough")}
        >
          <s>S</s>
        </button>

        <label className="tb color">
          A
          <input
            type="color"
            onChange={(e) => exec("foreColor", e.target.value)}
          />
        </label>
        <label className="tb color">
          ⬛
          <input
            type="color"
            onChange={(e) => exec("hiliteColor", e.target.value)}
          />
        </label>

        <button
          className="tb"
          title="• List"
          onClick={() => exec("insertUnorderedList")}
        >
          •
        </button>
        <button
          className="tb"
          title="1. List"
          onClick={() => exec("insertOrderedList")}
        >
          1.
        </button>
        <button className="tb" title="Thụt vào" onClick={() => exec("indent")}>
          ↦
        </button>
        <button className="tb" title="Lùi ra" onClick={() => exec("outdent")}>
          ↤
        </button>

        <button className="tb" title="Trái" onClick={() => exec("justifyLeft")}>
          ⬅
        </button>
        <button
          className="tb"
          title="Giữa"
          onClick={() => exec("justifyCenter")}
        >
          ↔
        </button>
        <button
          className="tb"
          title="Phải"
          onClick={() => exec("justifyRight")}
        >
          ➡
        </button>
        <button className="tb" title="Đều" onClick={() => exec("justifyFull")}>
          ≡
        </button>

        <button className="tb" title="Liên kết" onClick={createLink}>
          🔗
        </button>
        <button className="tb" title="Bỏ liên kết" onClick={removeLink}>
          ⛓️
        </button>

        <button className="tb" title="Chèn ảnh" onClick={handlePickImage}>
          🖼️
        </button>
        <input
          ref={inputFileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={onFileChange}
        />

        <button
          className="tb"
          title="Xóa định dạng"
          onClick={() => exec("removeFormat")}
        >
          ⌫
        </button>
        <button className="tb" title="Hoàn tác" onClick={() => exec("undo")}>
          ↶
        </button>
        <button className="tb" title="Làm lại" onClick={() => exec("redo")}>
          ↷
        </button>
      </div>

      <div
        ref={ref}
        className="editor-area"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
      />
    </div>
  );
}

/* ============== Editor "trang riêng" (không popup) ============== */
function NewsEditorPage({
  mode,
  initial,
  onSave,
  onBack,
}: {
  mode: "create" | "edit";
  initial?: Partial<NewsDto>;
  onSave: (payload: NewsCreateRequest | NewsUpdateRequest) => void;
  onBack: () => void;
}) {
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [isPublish, setIsPublish] = React.useState<boolean>(
    !!initial?.is_publish
  );
  const [thumbnail, setThumbnail] = React.useState<string | null | undefined>(
    initial?.thumbnail ?? undefined
  );
  const [thumbName, setThumbName] = React.useState<string | null>(null); // ✅ hiện tên file sau upload
  const [content, setContent] = React.useState<string>(initial?.content ?? "");

  const [confirmBack, setConfirmBack] = React.useState(false);
  const [thumbPreview, setThumbPreview] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const thumbInputRef = React.useRef<HTMLInputElement | null>(null);

  // nếu vào Sửa đã có thumbnail -> hiển thị tên tệp suy từ path
  React.useEffect(() => {
    if (initial?.thumbnail && !thumbName) {
      const base = initial.thumbnail.split("/").pop() || initial.thumbnail;
      setThumbName(base);
    }
  }, [initial?.thumbnail, thumbName]);

  const canSave = title.trim() !== "" && content.trim() !== "";

  const onUploadThumb = async (file: File) => {
    setUploading(true);
    try {
      const up = await uploadFile(file);
      // ✅ lưu filename vào thumbnail & hiện tên file (originalname)
      setThumbnail(up.filename);
      setThumbName(
        up.originalname || up.filename.split("/").pop() || up.filename
      );
      // clear input để có thể chọn lại cùng 1 file
      if (thumbInputRef.current) thumbInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  };

  const onUploadImageInContent = async (file: File) => {
    const up = await uploadFile(file);
    return toAbsoluteFileUrl(up.filename)!;
  };

  const openThumbPreview = () => {
    const url = toAbsoluteThumbUrl(thumbnail || undefined);
    if (url) setThumbPreview(url);
  };

  const handlePickThumb = () => thumbInputRef.current?.click();
  const onThumbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.currentTarget.files?.[0];
    if (f) onUploadThumb(f);
  };

  return (
    <div className="editor-page">
      <div className="editor-head">
        <button
          className="button"
          onClick={() => setConfirmBack(true)}
          title="Quay lại danh sách"
        >
          ← Quay lại
        </button>
        <div className="spacer" />
        <button
          className="button button--primary"
          disabled={!canSave}
          onClick={() =>
            onSave({
              title: title.trim(),
              content,
              thumbnail: thumbnail || null, // lưu filename
              is_publish: isPublish,
            })
          }
        >
          Lưu
        </button>
      </div>

      <div className="news-form">
        <div className="row">
          <div className="fi">
            <label>Tiêu đề</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề…"
            />
          </div>
          <div className="fi">
            <label>Công bố</label>
            <select
              value={isPublish ? "1" : "0"}
              onChange={(e) => setIsPublish(e.target.value === "1")}
            >
              <option value="1">Có</option>
              <option value="0">Không</option>
            </select>
          </div>
        </div>

        <div className="row">
          <div className="fi">
            <label>Hình thu nhỏ</label>
            <div className="hstack">
              {/* ✅ input file ẨN để không còn "Không có tệp nào được chọn" của trình duyệt */}
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onThumbFileChange}
              />
              <button
                type="button"
                className="button"
                onClick={handlePickThumb}
                disabled={uploading}
              >
                {uploading ? "Đang tải..." : "Chọn tệp"}
              </button>

              {/* ✅ sau upload hiển thị tên file; nếu chưa có thì hiển thị hint */}
              {thumbnail ? (
                <span className="file-name">
                  {thumbName || thumbnail.split("/").pop() || thumbnail}
                </span>
              ) : (
                <span className="hint">Chưa chọn hình</span>
              )}

              {/* ✅ ở màn Thêm cũng có nút Xem khi đã có thumbnail */}
              {thumbnail && (
                <button
                  type="button"
                  className="button linklike"
                  onClick={openThumbPreview}
                >
                  Xem hình
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="row col1">
          <div className="fi">
            <label>Nội dung</label>
            <RichEditor
              value={content}
              onChange={setContent}
              onUploadImage={onUploadImageInContent}
            />
          </div>
        </div>
      </div>

      {confirmBack && (
        <ConfirmModal
          text="Bạn có muốn thoát không?"
          onOk={onBack}
          onCancel={() => setConfirmBack(false)}
        />
      )}
      {thumbPreview && (
        <ImageModal src={thumbPreview} onClose={() => setThumbPreview(null)} />
      )}
    </div>
  );
}

/* ============== List Page ============== */
type SortKey = "title" | "publish" | "created" | "updated";
type SortDir = "asc" | "desc";

export default function NewsManagement() {
  // filters & paging
  const [q, setQ] = React.useState("");
  const [qDebounced, setQDebounced] = React.useState("");
  const [page, setPage] = React.useState(1);
  const LIMIT = 10;

  // data
  const [list, setList] = React.useState<NewsDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  // ui
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  // sort
  const [sortKey, setSortKey] = React.useState<SortKey>("updated");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  // editor routing state (trang riêng)
  const [mode, setMode] = React.useState<null | "create" | "edit">(null);
  const [editing, setEditing] = React.useState<NewsDto | null>(null);

  // selection for batch publish
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const selectedIds = React.useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected]
  );
  const allChecked = React.useMemo(
    () => list.length > 0 && list.every((r) => selected[r.id]),
    [list, selected]
  );

  // debounce search
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
        const res = await listNews({
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
        case "title":
          av = a.title || "";
          bv = b.title || "";
          break;
        case "publish":
          av = a.is_publish ? 1 : 0;
          bv = b.is_publish ? 1 : 0;
          break;
        case "created":
          av = a.created_at || "";
          bv = b.created_at || "";
          break;
        case "updated":
          av = a.updated_at || "";
          bv = b.updated_at || "";
          break;
      }
      const cmp =
        sortKey === "publish"
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

  // CRUD
  const onCreate = async (payload: NewsCreateRequest) => {
    await createNews(payload);
    setMode(null);
    setPage(1);
    await fetchList(1, qDebounced);
    setMsg("Thêm tin tức thành công.");
  };
  const onUpdate = async (id: string, payload: NewsUpdateRequest) => {
    await updateNews(id, payload);
    setMode(null);
    setEditing(null);
    await fetchList(page, qDebounced);
    setMsg("Cập nhật tin tức thành công.");
  };
  const onDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa tin tức này?")) return;
    await deleteNews(id);
    const newTotal = Math.max(0, total - 1);
    const newTotalPages = Math.max(1, Math.ceil(newTotal / LIMIT));
    const newPage = Math.min(page, newTotalPages);
    setPage(newPage);
    await fetchList(newPage, qDebounced);
    setMsg("Xóa tin tức thành công.");
  };

  const setPublishForSelected = async (val: boolean) => {
    if (selectedIds.length === 0) {
      setMsg("Vui lòng chọn ít nhất một bản ghi.");
      return;
    }
    try {
      await Promise.allSettled(
        selectedIds.map((id) =>
          updateNews(id, {
            title: list.find((x) => x.id === id)?.title || "",
            content: list.find((x) => x.id === id)?.content || "",
            thumbnail: list.find((x) => x.id === id)?.thumbnail || null,
            is_publish: val,
          })
        )
      );
      setSelected({});
      await fetchList(page, qDebounced);
      setMsg(
        val ? "Đã công bố bản ghi đã chọn." : "Đã hủy công bố bản ghi đã chọn."
      );
    } catch (e: any) {
      setMsg(e?.message || "Có lỗi khi cập nhật.");
    }
  };

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

  /* ======= Render ======= */
  if (mode === "create") {
    return (
      <div className="news-wrap">
        <div className="ncard shadow-card">
          <div className="page-head">
            <div className="page-title">Thêm tin tức</div>
          </div>
          <NewsEditorPage
            mode="create"
            onSave={onCreate}
            onBack={() => setMode(null)}
          />
        </div>
        {msg && <MessageModal message={msg} onClose={() => setMsg(null)} />}
      </div>
    );
  }
  if (mode === "edit" && editing) {
    return (
      <div className="news-wrap">
        <div className="ncard shadow-card">
          <div className="page-head">
            <div className="page-title">Sửa tin tức</div>
          </div>
          <NewsEditorPage
            mode="edit"
            initial={editing}
            onSave={(payload) => onUpdate(editing.id, payload)}
            onBack={() => {
              setMode(null);
              setEditing(null);
            }}
          />
        </div>
        {msg && <MessageModal message={msg} onClose={() => setMsg(null)} />}
      </div>
    );
  }

  // Danh sách
  return (
    <div className="news-wrap">
      <div className="ncard shadow-card">
        <div className="page-head">
          <div className="page-title">Quản lý tin tức</div>
          <div style={{ marginLeft: "auto", opacity: 0.9 }}>
            Trang {totalPages ? current : 0}/{totalPages} • Tổng {total} bản ghi
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-group">
            <label htmlFor="searchNews" className="search-label">
              Tìm kiếm
            </label>
            <input
              id="searchNews"
              className="search"
              placeholder="Tìm theo tiêu đề…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="batch" style={{ display: "flex", gap: 8 }}>
            <button
              className="button"
              disabled={selectedIds.length === 0}
              onClick={() => setPublishForSelected(true)}
            >
              Công bố
            </button>
            <button
              className="button"
              disabled={selectedIds.length === 0}
              onClick={() => setPublishForSelected(false)}
            >
              Hủy Công bố
            </button>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <button
              className="button button--primary"
              onClick={() => setMode("create")}
            >
              + Thêm tin tức
            </button>
          </div>
        </div>

        {error && <div className="search-empty-banner">{error}</div>}
        {loading && <div className="count">Đang tải…</div>}

        <div className="thead">Danh sách tin tức</div>

        <div className="list" role="list">
          {!isNoData && (
            <div
              className="news-tr tr--head"
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
              <div className="th" onClick={() => toggleSort("title")}>
                Tiêu đề
                <span className={cx("sort-icons", sortKey === "title" && "on")}>
                  <i>▲</i>
                  <i>▼</i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSort("publish")}>
                Công bố
                <span
                  className={cx("sort-icons", sortKey === "publish" && "on")}
                >
                  <i>▲</i>
                  <i>▼</i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSort("created")}>
                Ngày tạo
                <span
                  className={cx("sort-icons", sortKey === "created" && "on")}
                >
                  <i>▲</i>
                  <i>▼</i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSort("updated")}>
                Ngày thay đổi
                <span
                  className={cx("sort-icons", sortKey === "updated" && "on")}
                >
                  <i>▲</i>
                  <i>▼</i>
                </span>
              </div>
              <div style={{ textAlign: "right" }}>Thao tác</div>
            </div>
          )}

          {sorted.map((r) => (
            <div key={r.id} className="news-tr" role="listitem">
              <div className="td checkbox-cell">
                <input
                  type="checkbox"
                  checked={!!selected[r.id]}
                  onChange={(e) => toggleOne(r.id, e.target.checked)}
                />
              </div>
              <div className="td td--title">{r.title || "—"}</div>
              <div className="td">{r.is_publish ? "Có" : "Không"}</div>
              <div className="td">{r.created_at || "—"}</div>
              <div className="td">{r.updated_at || "—"}</div>
              <div
                className="td td--actions"
                style={{
                  textAlign: "right",
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="button"
                  onClick={async () => {
                    try {
                      const detail = await getNews(r.id);
                      setEditing(detail.data);
                    } catch {
                      setEditing(r);
                    }
                    setMode("edit");
                  }}
                >
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

      {msg && <MessageModal message={msg} onClose={() => setMsg(null)} />}
    </div>
  );
}
