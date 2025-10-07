// File: Home.tsx
import * as React from "react";
import "./Home.css";
import QuickActions from "../../components/QuickActions/QuickActions";

/** ========= Types ========= */
type NewsItem = {
  id: string;
  title: string;
  content: string;
  thumbnail?: string | null;
  is_publish?: boolean;
  updated_at?: string;
};
type NewsListRes = {
  message: string;
  data: { data: NewsItem[]; total: number; page: number; limit: number };
};

type EventItem = {
  id: string;
  name: string;
  event_date: string; // yyyy-mm-dd
  location?: string | null;
  description?: string | null;
};
type EventsListRes = {
  message: string;
  data: { data: EventItem[]; total: number; page: number; limit: number };
};

type AlbumItem = { id: string; name: string; description?: string | null };
type AlbumsListRes = {
  message: string;
  data: { data: AlbumItem[]; total: number; page: number; limit: number };
};
type PhotoItem = { id: string; url: string };

/** ========= Helpers ========= */
const API_BASE = "http://localhost:3000/api/v1";
const FILE_BASE = "http://localhost:3000";

function authHeaders(): HeadersInit {
  const t = localStorage.getItem("access_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}
function toNewsThumbUrl(thumbnail?: string | null): string | null {
  if (!thumbnail) return null;
  if (/^https?:\/\//i.test(thumbnail)) return thumbnail;
  const f = thumbnail.startsWith("uploads/")
    ? thumbnail
    : `uploads/${thumbnail}`;
  return `${FILE_BASE}/${f}`;
}
function toFileUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? `${FILE_BASE}${path}` : `${FILE_BASE}/${path}`;
}
function stripHtml(html: string, max = 110): string {
  const el = document.createElement("div");
  el.innerHTML = html || "";
  const text = (el.textContent || el.innerText || "")
    .trim()
    .replace(/\s+/g, " ");
  return text.length > max ? text.slice(0, max).trim() + "..." : text;
}
function fmtDateISO(d?: string | null): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d || "";
  const dd = `${dt.getDate()}`.padStart(2, "0");
  const mm = `${dt.getMonth() + 1}`.padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** ========= Calendar (VN) ========= */
const VN_MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];
const VN_WEEK = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
];
const wdMon0 = (d: Date) => (d.getDay() + 6) % 7;
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
function buildMonthMatrix(y: number, m: number) {
  const first = new Date(y, m, 1);
  const start = wdMon0(first);
  const dim = daysInMonth(y, m);
  const prevDim = daysInMonth(y, m - 1);
  const cells: Array<{ y: number; m: number; d: number; inMonth: boolean }> =
    [];
  for (let i = 0; i < start; i++)
    cells.push({ y, m: m - 1, d: prevDim - start + 1 + i, inMonth: false });
  for (let d = 1; d <= dim; d++) cells.push({ y, m, d, inMonth: true });
  while (cells.length % 7 !== 0) {
    const idx = cells.length - (start + dim);
    cells.push({ y, m: m + 1, d: idx + 1, inMonth: false });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1];
    cells.push({ y: last.y, m: last.m, d: last.d + 1, inMonth: false });
  }
  return cells;
}

/** ========= Modal ========= */
function EventModal({
  events,
  dateLabel,
  onClose,
}: {
  events: EventItem[];
  dateLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="hm-modal-backdrop" onClick={onClose}>
      <div className="hm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hm-modal-head">
          <div className="hm-modal-title">Sự kiện ngày {dateLabel}</div>
          <button className="hm-btn hm-btn--ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="hm-modal-body">
          {events.map((ev) => (
            <div key={ev.id} className="ev-item">
              <div className="ev-name">{ev.name}</div>
              <div className="ev-sub">
                <span>Địa điểm: {ev.location || "—"}</span>
                <span>• Ngày: {fmtDateISO(ev.event_date)}</span>
              </div>
              {ev.description && (
                <div className="ev-desc">{ev.description}</div>
              )}
            </div>
          ))}
          {events.length === 0 && <div>Không có sự kiện.</div>}
          <div className="hm-center">
            <button className="hm-btn hm-btn--primary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ========= Main ========= */
export default function Home() {
  const isLoggedIn = !!localStorage.getItem("access_token");

  const [news, setNews] = React.useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = React.useState(false);

  const [albums, setAlbums] = React.useState<AlbumItem[]>([]);
  const [albumsLoading, setAlbumsLoading] = React.useState(false);
  const [covers, setCovers] = React.useState<Record<string, string | null>>({});

  const today = new Date();
  const [mYear, setMYear] = React.useState(today.getFullYear());
  const [mMonth, setMMonth] = React.useState(today.getMonth());
  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [selectedDay, setSelectedDay] = React.useState<{
    date: string;
    events: EventItem[];
  } | null>(null);

  React.useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setNewsLoading(true);
        // Tối đa 4 bài
        const res = await fetch(`${API_BASE}/news?page=1&limit=4`, {
          headers: authHeaders(),
          credentials: "include",
        });
        const json = (await res.json()) as NewsListRes;
        if (ok) setNews((json.data?.data || []).slice(0, 4));
      } catch {
        if (ok) setNews([]);
      } finally {
        if (ok) setNewsLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  React.useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setAlbumsLoading(true);
        const res = await fetch(`${API_BASE}/albums?page=1&limit=4`, {
          headers: authHeaders(),
          credentials: "include",
        });
        const json = (await res.json()) as AlbumsListRes;
        const list = (json.data?.data || []).slice(0, 4);
        if (ok) setAlbums(list);

        const map: Record<string, string | null> = {};
        for (const a of list) {
          try {
            const r = await fetch(`${API_BASE}/albums/${a.id}/photos/`, {
              headers: authHeaders(),
              credentials: "include",
            });
            const j = (await r.json()) as
              | { data?: { data?: PhotoItem[] } }
              | { data?: { message?: string; data?: PhotoItem[] } };
            const photos: any =
              (j as any)?.data?.data || (j as any)?.data || [];
            const first: PhotoItem | undefined = Array.isArray(photos)
              ? photos[0]
              : undefined;
            map[a.id] = first?.url ? toFileUrl(first.url) : null;
          } catch {
            map[a.id] = null;
          }
        }
        if (ok) setCovers(map);
      } catch {
        if (ok) setAlbums([]);
      } finally {
        if (ok) setAlbumsLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  React.useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/events?page=1&limit=1000`, {
          headers: authHeaders(),
          credentials: "include",
        });
        const json = (await res.json()) as EventsListRes;
        if (ok) setEvents(json.data?.data || []);
      } catch {
        if (ok) setEvents([]);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  const eventMap = React.useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    for (const e of events) (map[e.event_date] ||= []).push(e);
    return map;
  }, [events]);

  const cells = React.useMemo(
    () => buildMonthMatrix(mYear, mMonth),
    [mYear, mMonth]
  );
  const prevMonth = () => {
    const d = new Date(mYear, mMonth - 1, 1);
    setMYear(d.getFullYear());
    setMMonth(d.getMonth());
  };
  const nextMonth = () => {
    const d = new Date(mYear, mMonth + 1, 1);
    setMYear(d.getFullYear());
    setMMonth(d.getMonth());
  };
  const go = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="home theme-classic">
      {/* ===== Hero ===== */}
      <section className="hero">
        <div className="hero-overlay">
          <h1 className="hero-title">Dòng họ Nguyễn Văn - Nghệ An</h1>
          <div className="hero-actions">
            {!isLoggedIn && (
              <button className="btn btn--primary" onClick={() => go("/login")}>
                Đăng nhập
              </button>
            )}
            <button className="btn" onClick={() => go("/cay-gia-pha")}>
              Xem cây gia phả
            </button>
          </div>
        </div>
      </section>

      <div className="container">
        {/* ===== Quick tiles ===== */}
        <section className="section-bg">
          <QuickActions />
        </section>

        {/* ===== Tin tức & Hoạt động (tối đa 4 ô) ===== */}
        <section className="news-sec section-bg">
          <div className="sec-title">Tin tức &amp; Hoạt động</div>
          {newsLoading ? (
            <div className="sec-empty">Đang tải…</div>
          ) : news.length === 0 ? (
            <div className="sec-empty">Chưa có bài viết mới</div>
          ) : (
            <div className="news-grid news-4">
              {news.map((n) => {
                const img = toNewsThumbUrl(n.thumbnail || undefined);
                return (
                  <div key={n.id} className="news-card">
                    {img && (
                      <div
                        className="news-thumb"
                        style={{ backgroundImage: `url(${img})` }}
                      />
                    )}
                    <div className="news-meta">
                      <div className="news-date">
                        {fmtDateISO(n.updated_at)}
                      </div>
                      <div className="news-title">{n.title}</div>
                      <div className="news-excerpt">{stripHtml(n.content)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="section-footer">
            <button className="link-btn" onClick={() => go("/news")}>
              Xem thêm
            </button>
          </div>
        </section>

        {/* ===== Events + Family ===== */}
        <section className="events-family section-bg">
          <div className="events-box">
            <div className="sec-title small">Sự kiện sắp diễn ra</div>
            <div className="cal-head">
              <button className="cal-nav" onClick={prevMonth}>
                ‹
              </button>
              <div className="cal-title">
                {VN_MONTHS[mMonth]} {mYear}
              </div>
              <button className="cal-nav" onClick={nextMonth}>
                ›
              </button>
            </div>
            <div className="cal-grid">
              {VN_WEEK.map((w) => (
                <div key={w} className="cal-wd">
                  {w}
                </div>
              ))}
              {cells.map((c, idx) => {
                const mm = String(c.m + 1).padStart(2, "0");
                const dd = String(c.d).padStart(2, "0");
                const key = `${c.y}-${mm}-${dd}`;
                const es = eventMap[key] || [];
                return (
                  <div
                    key={idx}
                    className={`cal-cell ${c.inMonth ? "" : "dim"}`}
                    onClick={() =>
                      es.length > 0 &&
                      setSelectedDay({ date: `${dd}/${mm}/${c.y}`, events: es })
                    }
                  >
                    <span
                      className={es.length ? "cal-day has-event" : "cal-day"}
                    >
                      {c.d}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="family-card" onClick={() => go("/family-info")}>
            <div className="family-img" />
            <div className="family-overlay">
              <div className="family-tt">Về dòng họ</div>
              <div className="family-sub">
                Dòng họ Nguyễn Văn ở Thanh Chương, Nghệ An
              </div>
            </div>
          </div>
          <div className="section-footer">
            <button className="link-btn" onClick={() => go("/news")}>
              Xem thêm
            </button>
          </div>
        </section>

        {/* ===== Albums (4 ô, cover + info) ===== */}
        <section className="albums-sec section-bg">
          <div className="sec-title small">Thư viện ảnh</div>
          {albumsLoading ? (
            <div className="sec-empty">Đang tải…</div>
          ) : albums.length === 0 ? (
            <div className="sec-empty">Không có thư mục ảnh</div>
          ) : (
            <div className="albums-grid albums-4">
              {albums.map((a) => {
                const cover = covers[a.id];
                return (
                  <div key={a.id} className="album-card album-split">
                    <div className="album-cover">
                      {cover ? (
                        <div
                          className="album-cover-img"
                          style={{ backgroundImage: `url(${cover})` }}
                        />
                      ) : (
                        <div className="album-empty">Thư mục trống</div>
                      )}
                    </div>
                    <div className="album-info">
                      <div className="album-name">{a.name}</div>
                      <div className="album-desc">{a.description || "—"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="section-footer">
            <button
              className="link-btn"
              onClick={() => window.location.assign("/albums")}
            >
              Xem thêm
            </button>
          </div>
        </section>
      </div>

      {selectedDay && (
        <EventModal
          dateLabel={selectedDay.date}
          events={selectedDay.events}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
