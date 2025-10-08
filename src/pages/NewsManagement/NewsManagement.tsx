// NewsManagement.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./NewsManagement.css";
import {
  listNews,
  createNews,
  updateNews,
  deleteNews,
  getNews,
  uploadFile,
  bulkPatch,
  fetchNewsPageHtml,
} from "./newsApi";
import type { NewsPayload } from "./newsApi";
import { Editor } from "@tinymce/tinymce-react";

/* ======= TinyMCE self-host (không cần API key, không hiện overlay) ======= */
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autolink";
import "tinymce/plugins/lists";
import "tinymce/plugins/link";
import "tinymce/plugins/image";
import "tinymce/plugins/charmap";
import "tinymce/plugins/preview";
import "tinymce/plugins/anchor";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/code";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/insertdatetime";
import "tinymce/plugins/media";
import "tinymce/plugins/table";
import "tinymce/plugins/help";
import "tinymce/plugins/wordcount";
import "tinymce/plugins/quickbars";
import "tinymce/plugins/autoresize";
/* ======================================================================= */

type Row = {
  id: string;
  title: string;
  content: string;
  thumbnail?: string | null;
  is_publish: boolean;
  created_at?: string;
  updated_at?: string;
};

const FILE_BASE = "http://localhost:3000";
const toFileUrl = (path?: string | null) =>
  !path
    ? null
    : path.startsWith("/")
    ? `${FILE_BASE}${path}`
    : `${FILE_BASE}/${path}`;

/** Chế độ màn hình */
type Mode =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; id: string };

export default function NewsManagement() {
  const [mode, setMode] = useState<Mode>({ kind: "list" });

  return mode.kind === "list" ? (
    <ListView
      onCreate={() => setMode({ kind: "create" })}
      onEdit={(id) => setMode({ kind: "edit", id })}
    />
  ) : (
    <EditorPage mode={mode} onBack={() => setMode({ kind: "list" })} />
  );
}

/* ================== LIST VIEW ================== */
function ListView({
  onCreate,
  onEdit,
}: {
  onCreate: () => void;
  onEdit: (id: string) => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  async function load() {
    setLoading(true);
    try {
      const data = await listNews(page, limit, search);
      setRows(data?.data?.data || []);
      setTotal(data?.data?.total || 0);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function openNewsPage(id: string) {
    const w = window.open("", "_blank");
    try {
      const html: string = await fetchNewsPageHtml(id); // <- gán kiểu rõ ràng
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e: any) {
      if (w) w.close();
      if (String(e?.message).includes("Unauthorized")) {
        alert("Bạn không có quyền hoặc phiên hết hạn. Vui lòng đăng nhập lại.");
        window.location.href = "/login";
      } else {
        alert("Không mở được trang tin tức.");
      }
    }
  }

  return (
    <div className="nm-wrap">
      <div className="nm-head">
        <div className="page-title">Quản lý tin tức</div>

        <div className="nm-actions">
          <div className="nm-search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề..."
            />
            <button
              className="btn"
              onClick={() => {
                setPage(1);
                load();
              }}
            >
              Tìm kiếm
            </button>
          </div>

          <div className="nm-bulk">
            <button
              className="btn"
              disabled={selected.size === 0}
              onClick={async () => {
                await bulkPatch(Array.from(selected), { is_publish: true });
                load();
              }}
            >
              Phát hành
            </button>
            <button
              className="btn"
              disabled={selected.size === 0}
              onClick={async () => {
                await bulkPatch(Array.from(selected), { is_publish: false });
                load();
              }}
            >
              Hủy Phát hành
            </button>
            <button className="btn btn-primary" onClick={onCreate}>
              + Thêm tin tức
            </button>
          </div>
        </div>
      </div>

      <div className="nm-table">
        <div className="nm-row nm-row--head">
          <div className="nm-col nm-col--check">
            <input
              type="checkbox"
              checked={
                selected.size > 0 && rows.every((r) => selected.has(r.id))
              }
              onChange={(e) => {
                const set = new Set<string>();
                if (e.target.checked) rows.forEach((r) => set.add(r.id));
                setSelected(set);
              }}
            />
          </div>
          <div className="nm-col nm-col--title">Tiêu đề</div>
          <div className="nm-col nm-col--pub">Phát hành</div>
          <div className="nm-col nm-col--date">Ngày tạo</div>
          <div className="nm-col nm-col--date">Ngày thay đổi</div>
          <div className="nm-col nm-col--act">Thao tác</div>
        </div>

        {loading ? (
          <div className="nm-empty">Đang tải…</div>
        ) : rows.length === 0 ? (
          <div className="nm-empty">Chưa có bài viết</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="nm-row">
              <div className="nm-col nm-col--check">
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={(e) => {
                    const set = new Set(selected);
                    if (e.target.checked) set.add(r.id);
                    else set.delete(r.id);
                    setSelected(set);
                  }}
                />
              </div>
              <div className="nm-col nm-col--title ellipsis">{r.title}</div>
              <div className="nm-col nm-col--pub">
                {r.is_publish ? "Có" : "Không"}
              </div>
              <div className="nm-col nm-col--date">
                {(r.created_at || "").slice(0, 10)}
              </div>
              <div className="nm-col nm-col--date">
                {(r.updated_at || "").slice(0, 10)}
              </div>
              <div className="nm-col nm-col--act">
                <button className="btn" onClick={() => onEdit(r.id)}>
                  Sửa
                </button>
                <button
                  className="btn btn-danger"
                  onClick={async () => {
                    if (!window.confirm("Xóa bài viết này?")) return;
                    await deleteNews(r.id);
                    load();
                  }}
                >
                  Xóa
                </button>
                <button className="btn" onClick={() => openNewsPage(r.id)}>
                  Xem
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Phân trang giao diện cũ (nút số tròn – căn giữa) */}
      <div className="nm-paging old-style">
        <button
          className="pg"
          disabled={page <= 1}
          onClick={() => setPage(1)}
          aria-label="Trang đầu"
        >
          «
        </button>
        <button
          className="pg"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          aria-label="Trang trước"
        >
          ‹
        </button>

        <div className="pg-list">
          {Array.from({ length: Math.max(1, totalPages) }).map((_, i) => {
            const idx = i + 1;
            return (
              <button
                key={idx}
                className={`pg-num ${idx === page ? "active" : ""}`}
                onClick={() => setPage(idx)}
              >
                {idx}
              </button>
            );
          })}
        </div>

        <button
          className="pg"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          aria-label="Trang sau"
        >
          ›
        </button>
        <button
          className="pg"
          disabled={page >= totalPages}
          onClick={() => setPage(totalPages)}
          aria-label="Trang cuối"
        >
          »
        </button>

        <span className="nm-total">
          Trang {page}/{totalPages} • Tổng {total} bản ghi
        </span>
      </div>
    </div>
  );
}

/* ================== EDITOR PAGE ================== */
function EditorPage({ mode, onBack }: { mode: Mode; onBack: () => void }) {
  const [title, setTitle] = useState("");
  const [isPublish, setIsPublish] = useState(true);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbName, setThumbName] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (mode.kind === "edit") {
      (async () => {
        const data = await getNews(mode.id);
        const n = data?.data;
        setTitle(n?.title || "");
        setIsPublish(!!n?.is_publish);
        setContent(n?.content || "");
        setThumbnail(n?.thumbnail || null);
        setThumbName(n?.thumbnail || "");
      })();
    }
  }, [mode]);

  async function handleSave() {
    setBusy(true);
    try {
      const payload: NewsPayload = {
        title,
        content,
        thumbnail: thumbnail || undefined,
        is_publish: isPublish,
      };
      if (mode.kind === "create") await createNews(payload);
      else if (mode.kind === "edit") await updateNews(mode.id, payload);
      onBack();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="nm-editor">
      <div className="nm-ed-head">
        <button
          className="btn"
          onClick={() => {
            if (window.confirm("Bạn có muốn thoát không?")) onBack();
          }}
        >
          ← Quay lại
        </button>
        <div className="nm-ed-title">
          {mode.kind === "create" ? "Thêm tin tức" : "Sửa tin tức"}
        </div>
        <div className="nm-ed-gap" />
      </div>

      <div className="nm-ed-form">
        <div className="f-row">
          <label>Tiêu đề</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề..."
          />
        </div>

        <div className="f-row two">
          <div>
            <label>Phát hành</label>
            <select
              value={isPublish ? "1" : "0"}
              onChange={(e) => setIsPublish(e.target.value === "1")}
            >
              <option value="1">Có</option>
              <option value="0">Không</option>
            </select>
          </div>

          <div className="f-upload">
            <label>Hình thu nhỏ</label>
            <div className="upload-row">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const res = await uploadFile(f);
                  setThumbnail(res.data.filename);
                  setThumbName(res.data.originalname);
                }}
              />
              {thumbnail && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const url = toFileUrl(thumbnail);
                    if (url) {
                      const w = window.open(
                        "",
                        "_blank",
                        "noopener,noreferrer,width=900,height=700"
                      );
                      if (w)
                        w.document.write(
                          `<html><body style="margin:0"><img src="${url}" style="max-width:100%;max-height:100vh;display:block;margin:auto"/></body></html>`
                        );
                    }
                  }}
                >
                  Xem
                </button>
              )}
            </div>
            {thumbName && <div className="upload-name">{thumbName}</div>}
          </div>
        </div>

        <div className="f-row">
          <label>Mô tả (tùy chọn)</label>
          <textarea
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Mô tả ngắn cho bài viết..."
          />
        </div>

        <div className="f-row">
          <label>Nội dung</label>
          <Editor
            onInit={(_evt: unknown, editor: any) =>
              (editorRef.current = editor)
            }
            value={content}
            onEditorChange={(val: string) => setContent(val)}
            /* Không truyền apiKey để tránh overlay của Tiny Cloud */
            init={{
              height: 560,
              menubar: false,
              plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "help",
                "wordcount",
                "quickbars",
                "autoresize",
              ],
              toolbar:
                "undo redo | blocks fontfamily fontsize | bold italic underline forecolor backcolor | " +
                "alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | " +
                "table link image media | removeformat | code preview",
              quickbars_selection_toolbar:
                "bold italic | quicklink h2 h3 blockquote | bullist numlist",
              image_caption: true,
              object_resizing: "img",
              images_file_types: "jpg,jpeg,png,gif,webp",
              automatic_uploads: true,
              images_upload_handler: async (
                blobInfo: any,
                _progress: (p: number) => void
              ): Promise<string> => {
                const file = blobInfo.blob();
                const res = await uploadFile(file as any);
                const url = toFileUrl(res.data.filename);
                return url || "";
              },
              content_style:
                "body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6}" +
                "img{max-width:100%;height:auto;}",
            }}
          />
        </div>

        <div className="f-actions">
          <button
            className="btn"
            onClick={() => {
              if (window.confirm("Bạn có muốn thoát không?")) onBack();
            }}
          >
            Hủy
          </button>
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={handleSave}
          >
            {busy ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
