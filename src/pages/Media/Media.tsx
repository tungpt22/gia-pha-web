import * as React from "react";
import "./Media.css";

/* ===== Types ===== */
type Album = { id: string; name: string; date: string; author: string };
type ImageItem = {
  id: string;
  albumId: string;
  name: string;
  date: string;
  author: string;
  sizeMB: number;
  url: string;
};
type Mode = "images" | "albums";

/* ===== Seed data ===== */
const seedAlbums: Album[] = [
  { id: "a1", name: "Lễ khai giảng", date: "2025-09-05", author: "Admin" },
  { id: "a2", name: "Sinh hoạt CLB", date: "2025-08-12", author: "Admin" },
];
const seedImages: ImageItem[] = [
  {
    id: "img1",
    albumId: "a1",
    name: "Khai giảng 01.jpg",
    date: "2025-09-05",
    author: "Admin",
    sizeMB: 1.24,
    url: "", // sẽ hiển thị ảnh đính kèm hero.jpg theo yêu cầu
  },
  {
    id: "img2",
    albumId: "a2",
    name: "CLB 01.png",
    date: "2025-08-12",
    author: "Admin",
    sizeMB: 0.82,
    url: "",
  },
];

/* Ảnh đính kèm để xem popup khi click tên ảnh (đặt hero.jpg cạnh file build) */
const ATTACHED_IMAGE_URL = "hero.jpg";

/* ===== Utils ===== */
function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}
function buildPageList(total: number, current: number) {
  const pages: (number | string)[] = [];
  const window = 1;
  if (total <= 7) for (let i = 1; i <= total; i++) pages.push(i);
  else {
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
const today = () => new Date().toISOString().slice(0, 10);
const fmtMB = (n: number) => `${n.toFixed(2)} MB`;

/* ===== Base Modal ===== */
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
  message,
  onCancel,
  onConfirm,
}: {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title="Xác nhận" onClose={onCancel}>
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

/* ===== Add Image Modal ===== */
function AddImageModal({
  albums,
  onSave,
  onClose,
}: {
  albums: Album[];
  onSave: (img: ImageItem) => void;
  onClose: () => void;
}) {
  const [albumId, setAlbumId] = React.useState(albums[0]?.id ?? "");
  const [file, setFile] = React.useState<File | null>(null);

  const canSave = !!albumId && !!file;

  return (
    <Modal title="Thêm ảnh" onClose={onClose}>
      <div className="form form-grid">
        <div className="fi">
          <label>Album</label>
          <div className="control">
            <select
              value={albumId}
              onChange={(e) => setAlbumId(e.target.value)}
              disabled={albums.length === 0}
            >
              {albums.length === 0 ? (
                <option value="">Chưa có album — hãy tạo album trước</option>
              ) : (
                albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="fi" style={{ gridColumn: "1 / -1" }}>
          <label>Upload file</label>
          <div className="control">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                setFile(f || null);
                e.currentTarget.value = "";
              }}
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
              if (!file || !albumId) return;
              const img: ImageItem = {
                id: `img_${Date.now()}`,
                albumId,
                name: file.name,
                date: today(),
                author: "Admin",
                sizeMB: file.size / (1024 * 1024),
                url: "", // xem bằng hero.jpg theo yêu cầu
              };
              onSave(img);
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

/* ===== Add Album Modal ===== */
function AddAlbumModal({
  onSave,
  onClose,
}: {
  onSave: (a: Album) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState("");

  return (
    <Modal title="Thêm album" onClose={onClose}>
      <div className="form">
        <div className="fi">
          <label>Tên album</label>
          <div className="control">
            <input
              placeholder="VD: Sự kiện 20/11"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="actions actions--center actions--even">
          <button
            className="button button--primary"
            disabled={name.trim() === ""}
            onClick={() => {
              const a: Album = {
                id: `alb_${Date.now()}`,
                name: name.trim(),
                date: today(),
                author: "Admin",
              };
              onSave(a);
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

/* ===== Rename Modal ===== */
function RenameModal({
  title,
  value,
  onSave,
  onClose,
  placeholder,
}: {
  title: string;
  value: string;
  onSave: (newName: string) => void;
  onClose: () => void;
  placeholder: string;
}) {
  const [name, setName] = React.useState(value);
  return (
    <Modal title={title} onClose={onClose}>
      <div className="form">
        <div className="fi">
          <label>{placeholder}</label>
          <div className="control">
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <div className="actions actions--center actions--even">
          <button
            className="button button--primary"
            disabled={name.trim() === ""}
            onClick={() => onSave(name.trim())}
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

/* ===== Move Image (Change Album) Modal ===== */
function MoveImageModal({
  image,
  albums,
  onSave,
  onClose,
}: {
  image: ImageItem;
  albums: Album[];
  onSave: (newAlbumId: string) => void;
  onClose: () => void;
}) {
  const [albumId, setAlbumId] = React.useState(image.albumId);
  return (
    <Modal title="Thay đổi Album" onClose={onClose}>
      <div className="form">
        <div className="fi">
          <label>Album</label>
          <div className="control">
            <select
              value={albumId}
              onChange={(e) => setAlbumId(e.target.value)}
            >
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="actions actions--center actions--even">
          <button
            className="button button--primary"
            onClick={() => onSave(albumId)}
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
type ImgSortKey = "name" | "sizeMB" | "date" | "author";
type AlbSortKey = "name" | "date" | "author";
type SortDir = "asc" | "desc";

export default function Gallery() {
  const [mode, setMode] = React.useState<Mode>("images");

  const [albums, setAlbums] = React.useState<Album[]>(seedAlbums);
  const [images, setImages] = React.useState<ImageItem[]>(seedImages);

  const [q, setQ] = React.useState("");
  const [albumFilter, setAlbumFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);

  const [imgSortKey, setImgSortKey] = React.useState<ImgSortKey>("date");
  const [imgSortDir, setImgSortDir] = React.useState<SortDir>("desc");
  const [albSortKey, setAlbSortKey] = React.useState<AlbSortKey>("date");
  const [albSortDir, setAlbSortDir] = React.useState<SortDir>("desc");

  const [showAddImage, setShowAddImage] = React.useState(false);
  const [showAddAlbum, setShowAddAlbum] = React.useState(false);

  const [renamingImg, setRenamingImg] = React.useState<ImageItem | null>(null);
  const [renamingAlb, setRenamingAlb] = React.useState<Album | null>(null);

  const [movingImg, setMovingImg] = React.useState<ImageItem | null>(null);

  const [confirmImg, setConfirmImg] = React.useState<ImageItem | null>(null);
  const [confirmAlb, setConfirmAlb] = React.useState<Album | null>(null);

  const [viewImg, setViewImg] = React.useState<ImageItem | null>(null);

  const PAGE_SIZE = 10;

  React.useEffect(() => {
    setPage(1);
  }, [q, mode, albumFilter, imgSortKey, imgSortDir, albSortKey, albSortDir]);

  /* ===== Derived lists ===== */
  const filteredAlbums = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return albums;
    return albums.filter((a) =>
      `${a.name} ${a.author} ${a.date}`.toLowerCase().includes(kw)
    );
  }, [albums, q]);

  const sortedAlbums = React.useMemo(() => {
    const arr = [...filteredAlbums];
    arr.sort((a, b) => {
      let av: any, bv: any;
      switch (albSortKey) {
        case "name":
          av = a.name || "";
          bv = b.name || "";
          break;
        case "date":
          av = a.date || "";
          bv = b.date || "";
          break;
        case "author":
          av = a.author || "";
          bv = b.author || "";
          break;
      }
      const cmp = String(av).localeCompare(String(bv));
      return albSortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filteredAlbums, albSortKey, albSortDir]);

  const filteredImages = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    let arr = images;
    if (kw) {
      arr = arr.filter((i) =>
        `${i.name} ${i.author} ${i.date}`.toLowerCase().includes(kw)
      );
    }
    if (albumFilter !== "all") {
      arr = arr.filter((i) => i.albumId === albumFilter);
    }
    return arr;
  }, [images, q, albumFilter]);

  const sortedImages = React.useMemo(() => {
    const arr = [...filteredImages];
    arr.sort((a, b) => {
      let av: any, bv: any;
      switch (imgSortKey) {
        case "name":
          av = a.name || "";
          bv = b.name || "";
          break;
        case "date":
          av = a.date || "";
          bv = b.date || "";
          break;
        case "author":
          av = a.author || "";
          bv = b.author || "";
          break;
        case "sizeMB":
          av = a.sizeMB || 0;
          bv = b.sizeMB || 0;
          break;
      }
      const cmp =
        imgSortKey === "sizeMB"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return imgSortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filteredImages, imgSortKey, imgSortDir]);

  const data: (Album | ImageItem)[] =
    mode === "albums" ? sortedAlbums : sortedImages;
  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const paginated = data.slice(start, start + PAGE_SIZE);
  const isNoData = total === 0;

  /* ===== Handlers ===== */
  const toggleSortAlb = (key: AlbSortKey) => {
    if (albSortKey !== key) {
      setAlbSortKey(key);
      setAlbSortDir("asc");
    } else {
      setAlbSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };
  const toggleSortImg = (key: ImgSortKey) => {
    if (imgSortKey !== key) {
      setImgSortKey(key);
      setImgSortDir("asc");
    } else {
      setImgSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  const addAlbum = (a: Album) => {
    setAlbums((p) => [a, ...p]);
    setShowAddAlbum(false);
  };
  const addImage = (img: ImageItem) => {
    setImages((p) => [img, ...p]);
    setShowAddImage(false);
  };

  const renameAlbum = (alb: Album, newName: string) => {
    setAlbums((prev) =>
      prev.map((a) => (a.id === alb.id ? { ...a, name: newName } : a))
    );
    setRenamingAlb(null);
  };
  const renameImage = (img: ImageItem, newName: string) => {
    setImages((prev) =>
      prev.map((i) => (i.id === img.id ? { ...i, name: newName } : i))
    );
    setRenamingImg(null);
  };

  const moveImage = (img: ImageItem, newAlbumId: string) => {
    setImages((prev) =>
      prev.map((i) => (i.id === img.id ? { ...i, albumId: newAlbumId } : i))
    );
    setMovingImg(null);
  };

  const deleteImage = (img: ImageItem) => {
    setImages((prev) => prev.filter((i) => i.id !== img.id));
    setConfirmImg(null);
  };
  const deleteAlbum = (alb: Album) => {
    // Xóa album và mọi ảnh thuộc album đó
    setAlbums((prev) => prev.filter((a) => a.id !== alb.id));
    setImages((prev) => prev.filter((i) => i.albumId !== alb.id));
    if (albumFilter === alb.id) setAlbumFilter("all");
    setConfirmAlb(null);
  };

  const albumName = React.useCallback(
    (id: string) => albums.find((a) => a.id === id)?.name || "(Không rõ album)",
    [albums]
  );

  return (
    <div className="gallery-wrap">
      <div className="card">
        {/* Title */}
        <div className="page-head">
          <div className="page-title">Quản lý album & hình ảnh</div>
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
              placeholder={
                mode === "albums"
                  ? "Tìm theo tên album, người tạo…"
                  : "Tìm theo tên ảnh, người tạo…"
              }
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="modeSelect" className="filter-label">
              Chọn loại
            </label>
            <select
              id="modeSelect"
              className="filter"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="images">Hình ảnh</option>
              <option value="albums">Album</option>
            </select>
          </div>

          {mode === "images" && (
            <div className="filter-group">
              <label htmlFor="albumSelect" className="filter-label">
                Album
              </label>
              <select
                id="albumSelect"
                className="filter"
                value={albumFilter}
                onChange={(e) => setAlbumFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="button add-album-button"
            onClick={() => setShowAddAlbum(true)}
          >
            + Thêm album
          </button>
          <button
            className="button button--primary add-image-button"
            onClick={() => setShowAddImage(true)}
            disabled={albums.length === 0}
            title={albums.length === 0 ? "Hãy tạo album trước" : "Thêm ảnh"}
          >
            + Thêm ảnh
          </button>
        </div>

        {/* Empty banner */}
        {isNoData && (
          <div className="search-empty-banner">Không tìm thấy kết quả</div>
        )}
        <div className="count">Tìm thấy {total} kết quả</div>
        <div className="thead">Kết quả tìm kiếm</div>

        {/* List */}
        <div className="list" role="list">
          {/* Header */}
          {!isNoData && mode === "albums" && (
            <div
              className={cx("albums-tr", "tr--head", "tr--albums")}
              role="presentation"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="th" onClick={() => toggleSortAlb("name")}>
                <span>Tên</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      albSortKey === "name" && albSortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      albSortKey === "name" && albSortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSortAlb("date")}>
                <span>Ngày tạo</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      albSortKey === "date" && albSortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      albSortKey === "date" && albSortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSortAlb("author")}>
                <span>Người tạo</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      albSortKey === "author" && albSortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      albSortKey === "author" && albSortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div style={{ textAlign: "right" }}>Thao tác</div>
            </div>
          )}

          {!isNoData && mode === "images" && (
            <div
              className={cx("images-tr", "tr--head", "tr--images")}
              role="presentation"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="th" onClick={() => toggleSortImg("name")}>
                <span>Tên</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      imgSortKey === "name" && imgSortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      imgSortKey === "name" && imgSortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSortImg("sizeMB")}>
                <span>Dung lượng (MB)</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      imgSortKey === "sizeMB" && imgSortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      imgSortKey === "sizeMB" && imgSortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSortImg("date")}>
                <span>Ngày tạo</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      imgSortKey === "date" && imgSortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      imgSortKey === "date" && imgSortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div className="th" onClick={() => toggleSortImg("author")}>
                <span>Người tạo</span>
                <span className="sort-icons">
                  <i
                    className={cx(
                      "up",
                      imgSortKey === "author" && imgSortDir === "asc" && "on"
                    )}
                  >
                    ▲
                  </i>
                  <i
                    className={cx(
                      "down",
                      imgSortKey === "author" && imgSortDir === "desc" && "on"
                    )}
                  >
                    ▼
                  </i>
                </span>
              </div>
              <div style={{ textAlign: "right" }}>Thao tác</div>
            </div>
          )}

          {/* Rows */}
          {mode === "albums" &&
            (paginated as Album[]).map((a) => (
              <div
                key={a.id}
                className={cx("albums-tr", "tr--albums")}
                role="listitem"
              >
                <div className="td td--name">{a.name}</div>
                <div className="td">{a.date}</div>
                <div className="td">{a.author}</div>
                <div
                  className="td td--actions"
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  <button className="button" onClick={() => setRenamingAlb(a)}>
                    Sửa tên
                  </button>
                  <button
                    className="button button--danger"
                    onClick={() => setConfirmAlb(a)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}

          {mode === "images" &&
            (paginated as ImageItem[]).map((i) => (
              <div
                key={i.id}
                className={cx("images-tr", "tr--images")}
                role="listitem"
              >
                <div className="td td--name">
                  <a
                    href="#"
                    className="link"
                    onClick={(e) => {
                      e.preventDefault();
                      setViewImg(i);
                    }}
                  >
                    {i.name}
                  </a>
                </div>
                <div className="td">{fmtMB(i.sizeMB)}</div>
                <div className="td">{i.date}</div>
                <div className="td">{i.author}</div>
                <div
                  className="td td--actions"
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  <button className="button" onClick={() => setRenamingImg(i)}>
                    Sửa tên
                  </button>
                  <button className="button" onClick={() => setMovingImg(i)}>
                    Thay đổi Album
                  </button>
                  <button
                    className="button button--danger"
                    onClick={() => setConfirmImg(i)}
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

      {/* Modals */}
      {showAddAlbum && (
        <AddAlbumModal
          onSave={addAlbum}
          onClose={() => setShowAddAlbum(false)}
        />
      )}
      {showAddImage && (
        <AddImageModal
          albums={albums}
          onSave={addImage}
          onClose={() => setShowAddImage(false)}
        />
      )}

      {renamingAlb && (
        <RenameModal
          title="Sửa tên album"
          value={renamingAlb.name}
          placeholder="Tên album"
          onSave={(newName) => renameAlbum(renamingAlb, newName)}
          onClose={() => setRenamingAlb(null)}
        />
      )}
      {renamingImg && (
        <RenameModal
          title="Sửa tên hình ảnh"
          value={renamingImg.name}
          placeholder="Tên hình ảnh"
          onSave={(newName) => renameImage(renamingImg, newName)}
          onClose={() => setRenamingImg(null)}
        />
      )}
      {movingImg && (
        <MoveImageModal
          image={movingImg}
          albums={albums}
          onSave={(newAlbumId) => moveImage(movingImg, newAlbumId)}
          onClose={() => setMovingImg(null)}
        />
      )}

      {viewImg && (
        <Modal title={viewImg.name} onClose={() => setViewImg(null)}>
          <div className="img-view-meta">
            <div>
              <b>Album:</b> {albumName(viewImg.albumId)}
            </div>
            <div>
              <b>Ngày tạo:</b> {viewImg.date}
            </div>
            <div>
              <b>Người tạo:</b> {viewImg.author}
            </div>
            <div>
              <b>Dung lượng:</b> {fmtMB(viewImg.sizeMB)}
            </div>
          </div>
          <div className="img-view">
            {/* hiển thị ảnh đính kèm */}
            <img src={ATTACHED_IMAGE_URL} alt={viewImg.name} />
          </div>
        </Modal>
      )}

      {confirmImg && (
        <ConfirmDialog
          message={`Xóa hình ảnh "${confirmImg.name}"?`}
          onCancel={() => setConfirmImg(null)}
          onConfirm={() => deleteImage(confirmImg)}
        />
      )}
      {confirmAlb && (
        <ConfirmDialog
          message={`Xóa album "${confirmAlb.name}" và tất cả hình ảnh bên trong?`}
          onCancel={() => setConfirmAlb(null)}
          onConfirm={() => deleteAlbum(confirmAlb)}
        />
      )}
    </div>
  );
}
