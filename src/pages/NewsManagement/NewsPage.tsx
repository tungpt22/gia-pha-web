// NewsPage.tsx
import React, { useEffect, useState } from "react";
import "./NewsPage.css";
import { getNews } from "./newsApi";

export default function NewsPage() {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();
  const [content, setContent] = useState("");

  useEffect(() => {
    const id = window.location.pathname.split("/").pop() || "";
    (async () => {
      try {
        const res = await getNews(id);
        const n = res?.data;
        setTitle(n?.title || "");
        setUpdatedAt(n?.updated_at || n?.created_at);
        setContent(n?.content || "");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="news-page">
      <div className="np-container">
        <div className="np-head">
          <button
            className="btn"
            onClick={() => (window.location.href = "/admin/news")}
          >
            ← Quay lại
          </button>
        </div>

        {loading ? (
          <div className="np-empty">Đang tải…</div>
        ) : (
          <article className="np-article">
            <h1 className="np-title">{title}</h1>
            {updatedAt && (
              <div className="np-date">
                Cập nhật: {new Date(updatedAt).toLocaleString()}
              </div>
            )}
            <div
              className="np-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </article>
        )}
      </div>
    </div>
  );
}
