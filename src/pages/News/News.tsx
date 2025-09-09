import * as React from "react";
import "./News.css";

/* ===== Types ===== */
type NewsItem = {
  id: string;
  title: string;
  contentHtml: string;
  author: string;
  date: string; // YYYY-MM-DD
};

/* ===== Seed data ===== */
const seed: NewsItem[] = [
  {
    id: "n1",
    title: "Ra mắt cổng thông tin mới",
    contentHtml:
      "<p>Chúng tôi đã nâng cấp cổng thông tin với nhiều tính năng mới.</p>",
    author: "Quản trị viên",
    date: "2025-08-15",
  },
  {
    id: "n2",
    title: "Sự kiện khai giảng năm học 2025–2026",
    contentHtml:
      "<p>Lễ khai giảng sẽ diễn ra vào ngày 05/09/2025 tại hội trường lớn.</p>",
    author: "Ban tổ chức",
    date: "2025-09-01",
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

/* ===== Rich Text Editor (WYSIWYG + HTML code) ===== */
function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const [mode, setMode] = React.useState<"design" | "code">("design");
  const edRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const codeRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (mode === "design" && edRef.current) {
      // cập nhật nội dung khi chuyển từ code -> design
      edRef.current.innerHTML = value || "";
    }
  }, [mode]);

  const apply = (cmd: string, val?: string) => {
    if (mode !== "design") return;
    edRef.current?.focus();
    try {
      // @ts-ignore
      document.execCommand("styleWithCSS", false, true);
    } catch {}
    document.execCommand(cmd, false, val);
    // đồng bộ state
    onChange(edRef.current?.innerHTML || "");
  };

  const insertImageFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      apply("insertImage", String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <div className="rte-group">
          <select
            className="rte-select"
            onChange={(e) => apply("fontName", e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Font
            </option>
            <option>Arial</option>
            <option>Times New Roman</option>
            <option>Tahoma</option>
            <option>Verdana</option>
            <option>Georgia</option>
            <option>Courier New</option>
          </select>
          <select
            className="rte-select"
            onChange={(e) => apply("fontSize", e.target.value)}
            defaultValue=""
            title="Cỡ chữ"
          >
            <option value="" disabled>
              Cỡ
            </option>
            <option value="2">Nhỏ</option>
            <option value="3">Bình thường</option>
            <option value="4">Lớn</option>
            <option value="5">Rất lớn</option>
          </select>
          <select
            className="rte-select"
            onChange={(e) => apply("formatBlock", e.target.value)}
            defaultValue=""
            title="Kiểu đoạn"
          >
            <option value="" disabled>
              Kiểu
            </option>
            <option value="P">Đoạn</option>
            <option value="H1">H1</option>
            <option value="H2">H2</option>
            <option value="H3">H3</option>
          </select>
        </div>

        <div className="rte-group">
          <button className="rte-btn" onClick={() => apply("bold")} title="Đậm">
            B
          </button>
          <button
            className="rte-btn"
            onClick={() => apply("italic")}
            title="Nghiêng"
          >
            I
          </button>
          <button
            className="rte-btn"
            onClick={() => apply("underline")}
            title="Gạch chân"
          >
            U
          </button>
          <button
            className="rte-btn"
            onClick={() => apply("removeFormat")}
            title="Xoá định dạng"
          >
            ⌫
          </button>
        </div>

        <div className="rte-group">
          <button
            className="rte-btn"
            onClick={() => apply("justifyLeft")}
            title="Căn trái"
          >
            ⬅
          </button>
          <button
            className="rte-btn"
            onClick={() => apply("justifyCenter")}
            title="Căn giữa"
          >
            ⬌
          </button>
          <button
            className="rte-btn"
            onClick={() => apply("justifyRight")}
            title="Căn phải"
          >
            ➡
          </button>
        </div>

        <div className="rte-group">
          <button
            className="rte-btn"
            onClick={() => apply("insertUnorderedList")}
            title="Danh sách chấm"
          >
            ••
          </button>
          <button
            className="rte-btn"
            onClick={() => apply("insertOrderedList")}
            title="Danh sách số"
          >
            1.
          </button>
          <button
            className="rte-btn"
            onClick={() => {
              const url = prompt("Nhập URL:");
              if (url) apply("createLink", url);
            }}
            title="Chèn liên kết"
          >
            🔗
          </button>
          <button
            className="rte-btn"
            onClick={() => fileRef.current?.click()}
            title="Chèn ảnh"
          >
            🖼
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              if (f) insertImageFromFile(f);
              e.currentTarget.value = "";
            }}
          />
        </div>

        <div className="rte-group">
          <button
            className="rte-btn"
            onClick={() => apply("undo")}
            title="Undo"
          >
            ↶
          </button>
          <button
            className="rte-btn"
            onClick={() => apply("redo")}
            title="Redo"
          >
            ↷
          </button>
        </div>

        <div className="rte-spacer" />
        <div className="rte-group">
          <label className="rte-toggle">
            <input
              type="checkbox"
              checked={mode === "code"}
              onChange={(e) => {
                const next = e.target.checked ? "code" : "design";
                if (next === "code") {
                  // chuyển nội dung hiện tại sang textarea
                  if (edRef.current) {
                    onChange(edRef.current.innerHTML);
                    if (codeRef.current) {
                      codeRef.current.value = edRef.current.innerHTML;
                    }
                  }
                } else {
                  // từ code về design
                  if (codeRef.current && edRef.current) {
                    onChange(codeRef.current.value);
                    edRef.current.innerHTML = codeRef.current.value;
                  }
                }
                setMode(next);
              }}
            />
            <span>Xem HTML</span>
          </label>
        </div>
      </div>

      {mode === "design" ? (
        <div
          ref={edRef}
          className="rte-editor"
          contentEditable
          suppressContentEditableWarning
          onInput={() => onChange(edRef.current?.innerHTML || "")}
          dangerouslySetInnerHTML={{ __html: value || "" }}
        />
      ) : (
        <textarea
          ref={codeRef}
          className="rte-code"
          defaultValue={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

/* ===== Create/Edit Modal ===== */
function NewsModal({
  initial,
  onSave,
  onClose,
  title,
}: {
  initial?: Partial<NewsItem>;
  onSave: (it: NewsItem) => void;
  onClose: () => void;
  title: string;
}) {
  const [newsTitle, setNewsTitle] = React.useState(initial?.title ?? "");
  const [author, setAuthor] = React.useState(initial?.author ?? "");
  const [date, setDate] = React.useState(initial?.date ?? "");
  const [html, setHtml] = React.useState(initial?.contentHtml ?? "");

  const canSave =
    newsTitle.trim() !== "" && author.trim() !== "" && date.trim() !== "";

  return (
    <Modal title={title} onClose={onClose}>
      <div className="form form-grid">
        <div className="fi">
          <label>Tiêu đề</label>
          <div className="control">
            <input
              value={newsTitle}
              onChange={(e) => setNewsTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài viết"
            />
          </div>
        </div>

        <div className="fi">
          <label>Người tạo</label>
          <div className="control">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Nhập tên người tạo"
            />
          </div>
        </div>

        <div className="fi">
          <label>Ngày tạo</label>
          <div className="control">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="fi" style={{ gridColumn: "1 / -1" }}>
          <label>Nội dung</label>
          <RichEditor value={html} onChange={setHtml} />
        </div>

        <div
          className="actions actions--center actions--even"
          style={{ gridColumn: "1 / -1" }}
        >
          <button
            className="button button--primary"
            disabled={!canSave}
            onClick={async () => {
              const item: NewsItem = {
                id: initial?.id ?? `n_${Date.now()}`,
                title: newsTitle.trim(),
                contentHtml: html || "",
                author: author.trim(),
                date,
              };

              /* Gọi API lưu tin tức: thay đoạn dưới bằng fetch/axios của bạn
                 Ví dụ:
                 await fetch("/api/news", {
                   method: "POST",
                   headers: { "Content-Type": "application/json" },
                   body: JSON.stringify(item),
                 });
              */
              await mockCreateNewsAPI(item);

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
async function mockCreateNewsAPI(payload: NewsItem) {
  // giả lập latency:
  await new Promise((r) => setTimeout(r, 200));
  console.log("POST /api/news", payload);
}

/* ===== Page ===== */
type SortKey = "title" | "author" | "date";
type SortDir = "asc" | "desc";

export default function News() {
  const [list, setList] = React.useState<NewsItem[]>(seed);
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<SortKey>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [showAdd, setShowAdd] = React.useState(false);
  const [edit, setEdit] = React.useState<NewsItem | null>(null);
  const [view, setView] = React.useState<NewsItem | null>(null);

  const PAGE_SIZE = 10;

  const filtered = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return list;
    return list.filter((it) =>
      `${it.title} ${it.author} ${it.date} ${stripHtml(it.contentHtml)}`
        .toLowerCase()
        .includes(kw)
    );
  }, [list, q]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case "title":
          av = a.title || "";
          bv = b.title || "";
          break;
        case "author":
          av = a.author || "";
          bv = b.author || "";
          break;
        case "date":
          av = a.date || "";
          bv = b.date || "";
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
  const isSearchEmpty = q.trim() !== "" && total === 0;

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  const onCreate = (item: NewsItem) => {
    setList((prev) => [item, ...prev]);
    setShowAdd(false);
  };
  const onUpdate = (item: NewsItem) => {
    setList((prev) => prev.map((x) => (x.id === item.id ? item : x)));
    setEdit(null);
  };
  const onDelete = (id: string) =>
    setList((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="news-wrap">
      <div className="card">
        {/* Title */}
        <div className="page-head">
          <div className="page-title">Quản lý tin tức</div>
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
              placeholder="Tìm theo tiêu đề, người tạo, nội dung…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="toolbar-right">
            <button
              className="button button--primary add-btn"
              onClick={() => setShowAdd(true)}
            >
              + Thêm tin tức
            </button>
          </div>
        </div>

        {isSearchEmpty && (
          <div className="search-empty-banner">Không tìm thấy kết quả</div>
        )}
        <div className="count">Tìm thấy {total} kết quả</div>
        <div className="thead">Kết quả tìm kiếm</div>

        {/* List */}
        <div className="list" role="list">
          {!isNoData && (
            <div
              className="news-tr tr--head"
              role="presentation"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="th" onClick={() => toggleSort("title")}>
                <span>Tiêu đề</span>
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
              <div className="th" onClick={() => toggleSort("author")}>
                <span>Người tạo</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      sortKey === "author" && sortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      sortKey === "author" && sortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSort("date")}>
                <span>Ngày tạo</span>
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
              {/* <div style={{ textAlign: "right" }}>Thao tác</div> */}
            </div>
          )}

          {paginated.map((it) => (
            <div
              key={it.id}
              className="news-tr"
              role="listitem"
              title="Xem chi tiết"
            >
              <div
                className="td td--title"
                onClick={() => setView(it)}
                style={{ cursor: "pointer" }}
              >
                {it.title}
              </div>
              <div className="td">{it.author}</div>
              <div className="td">{it.date}</div>
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
                  onClick={() => onDelete(it.id)}
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
        <NewsModal
          title="Thêm tin tức"
          onSave={onCreate}
          onClose={() => setShowAdd(false)}
        />
      )}
      {edit && (
        <NewsModal
          title="Sửa tin tức"
          initial={edit}
          onSave={onUpdate}
          onClose={() => setEdit(null)}
        />
      )}
      {view && (
        <Modal title={view.title} onClose={() => setView(null)}>
          <div className="news-view-meta">
            <div>
              <b>Người tạo:</b> {view.author}
            </div>
            <div>
              <b>Ngày tạo:</b> {view.date}
            </div>
          </div>
          <div
            className="news-view-content"
            dangerouslySetInnerHTML={{ __html: view.contentHtml }}
          />
        </Modal>
      )}
    </div>
  );
}

/* Helpers */
function stripHtml(html: string) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}
