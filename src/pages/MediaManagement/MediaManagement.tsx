// File: MediaManagement.tsx
import * as React from "react";
import "./MediaManagement.css";

import {
  listAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  listPhotos,
  uploadPhotos,
  updatePhoto,
  deletePhoto,
  type AlbumDto,
  type PhotoDto,
} from "../../api/albumApi";

// ===== Helpers =====
function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}
function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  ms = 400
) {
  const ref = React.useRef<number | undefined>(undefined);
  return React.useCallback(
    (...args: Parameters<T>) => {
      if (ref.current) window.clearTimeout(ref.current);
      ref.current = window.setTimeout(() => fn(...args), ms);
    },
    [fn, ms]
  ) as T;
}

// MẪU USERS: tạo danh sách số trang với dấu …
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

// So sánh/ sort
type Dir = "asc" | "desc";
function comparePrimitive(a: any, b: any, dir: Dir) {
  const res = a < b ? -1 : a > b ? 1 : 0;
  return dir === "asc" ? res : -res;
}
function compareByKey<T extends Record<string, any>>(
  a: T,
  b: T,
  key: string,
  dir: Dir,
  isDate?: boolean
) {
  const va = a?.[key];
  const vb = b?.[key];
  if (isDate) {
    const ta = va ? new Date(va).getTime() : 0;
    const tb = vb ? new Date(vb).getTime() : 0;
    return comparePrimitive(ta, tb, dir);
  }
  const sa = (va ?? "").toString().toLowerCase();
  const sb = (vb ?? "").toString().toLowerCase();
  return comparePrimitive(sa, sb, dir);
}

// ===== Base Modal =====
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

// ===== Album Form Modal =====
function AlbumFormModal({
  title,
  initial,
  onSave,
  onClose,
}: {
  title: string;
  initial?: Partial<AlbumDto>;
  onSave: (payload: { name: string; description?: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? ""
  );
  return (
    <Modal title={title} onClose={onClose}>
      <div className="form">
        <div className="fi">
          <label>Tên album</label>
          <div className="control">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Giỗ họ 2025"
            />
          </div>
        </div>
        <div className="fi">
          <label>Mô tả</label>
          <div className="control">
            <textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn"
            />
          </div>
        </div>
        <div className="actions actions--center actions--even">
          <button
            className="button button--primary"
            disabled={!name.trim()}
            onClick={() =>
              onSave({
                name: name.trim(),
                description: description?.trim() || undefined,
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
    </Modal>
  );
}

// ===== Photo Modals =====
function UploadPhotosModal({
  album,
  onUploaded,
  onClose,
}: {
  album: AlbumDto;
  onUploaded: () => void;
  onClose: () => void;
}) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const doUpload = async () => {
    if (files.length === 0) return;
    setBusy(true);
    try {
      await uploadPhotos(album.id, files, name.trim() || undefined);
      onUploaded();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Thêm hình vào: ${album.name}`} onClose={onClose}>
      <div className="form">
        <div className="fi">
          <label>Chọn file (có thể nhiều)</label>
          <div className="control">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setFiles(Array.from(e.currentTarget.files || []))
              }
            />
          </div>
        </div>
        <div className="fi">
          <label>Tên ảnh (tuỳ chọn)</label>
          <div className="control">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Ảnh tổng quan"
            />
          </div>
        </div>
        <div className="actions actions--center actions--even">
          <button
            className="button button--primary"
            disabled={files.length === 0 || busy}
            onClick={doUpload}
          >
            {busy ? "Đang tải..." : "Tải lên"}
          </button>
          <button className="button" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}

function EditPhotoModal({
  albumId,
  photo,
  onSaved,
  onClose,
}: {
  albumId: string;
  photo: PhotoDto;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(photo.name);
  const [description, setDescription] = React.useState(photo.description ?? "");
  const [busy, setBusy] = React.useState(false);

  const doSave = async () => {
    setBusy(true);
    try {
      await updatePhoto(albumId, photo.id, {
        name: name.trim(),
        description: description.trim(),
      });
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Sửa hình ảnh" onClose={onClose}>
      <div className="form">
        <div className="fi">
          <label>Tên ảnh</label>
          <div className="control">
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <div className="fi">
          <label>Mô tả</label>
          <div className="control">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="actions actions--center actions--even">
          <button
            className="button button--primary"
            disabled={!name.trim() || busy}
            onClick={doSave}
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

/** ===== Lightbox xem ảnh ===== */
function Lightbox({
  albumId,
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  albumId: string;
  photos: PhotoDto[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const photo = photos[index];
  const src = `/uploads/albums/${albumId}/${photo.id}`; // đường dẫn theo yêu cầu (dùng / cho web)

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div className="lightbox-body" onClick={(e) => e.stopPropagation()}>
        <button
          className="lightbox-nav lightbox-nav--left"
          onClick={onPrev}
          aria-label="Previous"
        >
          ‹
        </button>
        <img className="lightbox-img" src={src} alt={photo.name} />
        <button
          className="lightbox-nav lightbox-nav--right"
          onClick={onNext}
          aria-label="Next"
        >
          ›
        </button>
        <div className="lightbox-caption">
          <div className="lightbox-name">{photo.name}</div>
          {photo.description ? (
            <div className="lightbox-desc">{photo.description}</div>
          ) : null}
        </div>
        <button className="lightbox-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
    </div>
  );
}

type Page = { name: "albums" } | { name: "photos"; album: AlbumDto };
type AlbSortKey = "name" | "description" | "created_dt" | "updated_dt";
type PhSortKey = "name" | "description" | "created_dt" | "updated_dt";

export default function MediaManagement() {
  // Trang mặc định là Albums
  const [page, setPage] = React.useState<Page>({ name: "albums" });

  // ===== Albums state =====
  const [albums, setAlbums] = React.useState<AlbumDto[]>([]);
  const [albTotal, setAlbTotal] = React.useState(0);
  const [albPage, setAlbPage] = React.useState(1);
  const [albLimit] = React.useState(10);
  const [albTotalPages, setAlbTotalPages] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [albSort, setAlbSort] = React.useState<{
    key: AlbSortKey | null;
    dir: Dir;
  }>({ key: null, dir: "asc" });

  const applyAlbumSort = React.useCallback(
    (data: AlbumDto[]) => {
      if (!albSort.key) return data;
      const isDate =
        albSort.key === "created_dt" || albSort.key === "updated_dt";
      const withIndex = data.map((v, i) => ({ v, i }));
      withIndex.sort((a, b) => {
        const c = compareByKey(a.v, b.v, albSort.key!, albSort.dir, isDate);
        return c !== 0 ? c : a.i - b.i; // stable
      });
      return withIndex.map((x) => x.v);
    },
    [albSort]
  );

  const fetchAlbums = React.useCallback(
    async (pageNum: number, keyword: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listAlbums({
          page: pageNum,
          limit: albLimit,
          search: keyword,
        });
        const sorted = applyAlbumSort(res.data.data);
        setAlbums(sorted);
        setAlbTotal(res.data.total);
        setAlbTotalPages(res.data.totalPages);
      } catch (e: any) {
        setError(e?.message || "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    },
    [albLimit, applyAlbumSort]
  );

  // Debounce tìm kiếm
  const debouncedSearch = useDebouncedCallback((kw: string) => {
    setAlbPage(1);
    fetchAlbums(1, kw);
  }, 400);

  React.useEffect(() => {
    fetchAlbums(albPage, q);
  }, [albPage]); // đổi trang
  React.useEffect(() => {
    debouncedSearch(q);
  }, [q]); // đổi từ khoá

  // Khi đổi sort album -> áp lại sort hiện thời trên data đang hiển thị (không gọi lại API)
  React.useEffect(() => {
    setAlbums((prev) => applyAlbumSort([...prev]));
  }, [albSort, applyAlbumSort]);

  const toggleAlbSort = (key: AlbSortKey) => {
    setAlbSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  const openPhotos = (album: AlbumDto) => setPage({ name: "photos", album });

  // ===== Photos state =====
  const [allPhotos, setAllPhotos] = React.useState<PhotoDto[]>([]);
  const [photos, setPhotos] = React.useState<PhotoDto[]>([]);
  const [phPage, setPhPage] = React.useState(1);
  const [phLimit] = React.useState(10);
  const [phTotalPages, setPhTotalPages] = React.useState(1);
  const [phTotalItems, setPhTotalItems] = React.useState(0); // tổng bản ghi (client-side)
  const [phQ, setPhQ] = React.useState("");
  const [phSort, setPhSort] = React.useState<{
    key: PhSortKey | null;
    dir: Dir;
  }>({ key: null, dir: "asc" });
  const [showUpload, setShowUpload] = React.useState(false);
  const [editingPhoto, setEditingPhoto] = React.useState<PhotoDto | null>(null);

  const loadPhotos = React.useCallback(async (albumId: string) => {
    const res = await listPhotos(albumId);
    setAllPhotos(res.data.data);
  }, []);

  // Lọc + sort + phân trang ảnh (client-side)
  const repaginatePhotos = React.useCallback(() => {
    // filter
    const filtered = phQ.trim()
      ? allPhotos.filter((p) =>
          `${p.name} ${p.description ?? ""}`
            .toLowerCase()
            .includes(phQ.trim().toLowerCase())
        )
      : allPhotos;

    // sort
    let sorted = filtered;
    if (phSort.key) {
      const isDate = phSort.key === "created_dt" || phSort.key === "updated_dt";
      const withIndex = filtered.map((v, i) => ({ v, i }));
      withIndex.sort((a, b) => {
        const c = compareByKey(a.v, b.v, phSort.key!, phSort.dir, isDate);
        return c !== 0 ? c : a.i - b.i; // stable
      });
      sorted = withIndex.map((x) => x.v);
    }

    // paginate + tổng
    const totalPages = Math.max(1, Math.ceil(sorted.length / phLimit));
    const safePage = Math.min(phPage, totalPages);
    const start = (safePage - 1) * phLimit;
    setPhTotalItems(sorted.length);
    setPhTotalPages(totalPages);
    setPhPage(safePage);
    setPhotos(sorted.slice(start, start + phLimit));
  }, [allPhotos, phQ, phPage, phLimit, phSort]);

  React.useEffect(() => {
    if (page.name === "photos") loadPhotos(page.album.id);
  }, [page, loadPhotos]);
  React.useEffect(() => {
    if (page.name === "photos") repaginatePhotos();
  }, [page, allPhotos, phPage, phQ, phSort, repaginatePhotos]);
  React.useEffect(() => {
    setPhPage(1);
  }, [phQ, phSort]); // khi đổi tìm kiếm / sắp xếp: về trang 1

  // ===== Handlers: Albums =====
  const [showAddAlbum, setShowAddAlbum] = React.useState(false);
  const [editingAlbum, setEditingAlbum] = React.useState<AlbumDto | null>(null);

  const doCreateAlbum = async (payload: {
    name: string;
    description?: string;
  }) => {
    await createAlbum(payload);
    setShowAddAlbum(false);
    setAlbPage(1);
    fetchAlbums(1, q);
  };

  const doUpdateAlbum = async (
    alb: AlbumDto,
    payload: { name: string; description?: string }
  ) => {
    await updateAlbum(alb.id, payload);
    setEditingAlbum(null);
    fetchAlbums(albPage, q);
  };

  const doDeleteAlbum = async (alb: AlbumDto) => {
    if (!confirm(`Xóa album "${alb.name}"?`)) return;
    await deleteAlbum(alb.id);
    setAlbPage(1);
    fetchAlbums(1, q);
  };

  // ===== Handlers: Photos =====
  const doDeletePhoto = async (albumId: string, photo: PhotoDto) => {
    if (!confirm(`Xóa hình ảnh "${photo.name}"?`)) return;
    await deletePhoto(albumId, photo.id);
    await loadPhotos(albumId);
    repaginatePhotos();
  };

  // ===== Lightbox state =====
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const openLightbox = (idx: number) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const nextLightbox = () =>
    setLightboxIndex((i) => (i === null ? i : (i + 1) % photos.length));
  const prevLightbox = () =>
    setLightboxIndex((i) =>
      i === null ? i : (i - 1 + photos.length) % photos.length
    );

  // ===== Render =====
  const renderSortIcon = (active: boolean, dir: Dir) => (
    <span
      className={cx("sort-icon", active && `sort-icon--${dir}`)}
      aria-hidden
    >
      ▴▾
    </span>
  );

  const ToolbarAlbums = (
    <div className="toolbar">
      <div className="search-group">
        <label htmlFor="searchInput" className="search-label">
          Tìm kiếm
        </label>
        <input
          id="searchInput"
          className="search"
          placeholder="Tìm theo tên/mô tả album…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <button
        className="button add-album-button"
        onClick={() => setShowAddAlbum(true)}
      >
        + Thêm Album
      </button>
    </div>
  );

  const ToolbarPhotos = (album: AlbumDto) => (
    <div className="toolbar">
      <button className="button" onClick={() => setPage({ name: "albums" })}>
        ← Quay lại
      </button>
      <div className="album-title">{album.name}</div>
      <div className="search-group" style={{ marginLeft: "auto" }}>
        <label htmlFor="searchPhotos" className="search-label">
          Tìm kiếm
        </label>
        <input
          id="searchPhotos"
          className="search"
          placeholder="Tìm theo tên/mô tả ảnh…"
          value={phQ}
          onChange={(e) => {
            setPhQ(e.target.value);
          }}
        />
      </div>
      <button
        className="button button--primary add-image-button"
        onClick={() => setShowUpload(true)}
      >
        + Thêm ảnh
      </button>
    </div>
  );

  const AlbHeader = (
    <div
      className={cx("albums-tr", "tr--head", "tr--albums")}
      role="presentation"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={cx("th", "th--sortable")}
        onClick={() => toggleAlbSort("name")}
      >
        <span>Tên</span>
        {renderSortIcon(albSort.key === "name", albSort.dir)}
      </div>
      <div
        className={cx("th", "th--sortable")}
        onClick={() => toggleAlbSort("description")}
      >
        <span>Mô tả</span>
        {renderSortIcon(albSort.key === "description", albSort.dir)}
      </div>
      <div
        className={cx("th", "th--sortable")}
        onClick={() => toggleAlbSort("created_dt")}
      >
        <span>Ngày tạo</span>
        {renderSortIcon(albSort.key === "created_dt", albSort.dir)}
      </div>
      <div
        className={cx("th", "th--sortable")}
        onClick={() => toggleAlbSort("updated_dt")}
      >
        <span>Ngày cập nhật</span>
        {renderSortIcon(albSort.key === "updated_dt", albSort.dir)}
      </div>
      <div style={{ textAlign: "right" }}>Thao tác</div>
    </div>
  );

  const togglePhSort = (key: PhSortKey) => {
    setPhSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  const PhotosHeader = (
    <div
      className={cx("images-tr", "tr--head", "tr--images-photos")}
      role="presentation"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={cx("th", "th--sortable")}
        onClick={() => togglePhSort("name")}
      >
        <span>Tên ảnh</span>
        {renderSortIcon(phSort.key === "name", phSort.dir)}
      </div>
      <div
        className={cx("th", "th--sortable")}
        onClick={() => togglePhSort("description")}
      >
        <span>Mô tả</span>
        {renderSortIcon(phSort.key === "description", phSort.dir)}
      </div>
      <div
        className={cx("th", "th--sortable")}
        onClick={() => togglePhSort("created_dt")}
      >
        <span>Ngày tạo</span>
        {renderSortIcon(phSort.key === "created_dt", phSort.dir)}
      </div>
      <div
        className={cx("th", "th--sortable")}
        onClick={() => togglePhSort("updated_dt")}
      >
        <span>Ngày cập nhật</span>
        {renderSortIcon(phSort.key === "updated_dt", phSort.dir)}
      </div>
      <div style={{ textAlign: "right" }}>Thao tác</div>
    </div>
  );

  // ===== Pagination components (giống Users) =====
  const AlbPagination = (
    <div className="pagination">
      <button
        className="page-btn"
        disabled={albPage <= 1}
        onClick={() => setAlbPage(1)}
        title="Trang đầu"
      >
        «
      </button>
      <button
        className="page-btn"
        disabled={albPage <= 1}
        onClick={() => setAlbPage((p) => Math.max(1, p - 1))}
        title="Trang trước"
      >
        ‹
      </button>
      {buildPageList(albTotalPages, albPage).map((p, i) =>
        typeof p === "number" ? (
          <button
            key={i}
            className={cx("page-btn", p === albPage && "page-btn--active")}
            onClick={() => setAlbPage(p)}
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
        disabled={albPage >= albTotalPages}
        onClick={() => setAlbPage((p) => Math.min(albTotalPages, p + 1))}
        title="Trang sau"
      >
        ›
      </button>
      <button
        className="page-btn"
        disabled={albPage >= albTotalPages}
        onClick={() => setAlbPage(albTotalPages)}
        title="Trang cuối"
      >
        »
      </button>
    </div>
  );

  const PhPagination = (
    <div className="pagination">
      <button
        className="page-btn"
        disabled={phPage <= 1}
        onClick={() => setPhPage(1)}
        title="Trang đầu"
      >
        «
      </button>
      <button
        className="page-btn"
        disabled={phPage <= 1}
        onClick={() => setPhPage((p) => Math.max(1, p - 1))}
        title="Trang trước"
      >
        ‹
      </button>
      {buildPageList(phTotalPages, phPage).map((p, i) =>
        typeof p === "number" ? (
          <button
            key={i}
            className={cx("page-btn", p === phPage && "page-btn--active")}
            onClick={() => setPhPage(p)}
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
        disabled={phPage >= phTotalPages}
        onClick={() => setPhPage((p) => Math.min(phTotalPages, p + 1))}
        title="Trang sau"
      >
        ›
      </button>
      <button
        className="page-btn"
        disabled={phPage >= phTotalPages}
        onClick={() => setPhPage(phTotalPages)}
        title="Trang cuối"
      >
        »
      </button>
    </div>
  );

  return (
    <div className="gallery-wrap">
      <div className="card">
        <div className="page-head">
          <div className="page-title">Quản lý album & hình ảnh</div>
        </div>

        {page.name === "albums" ? (
          <>
            {error && <div className="search-empty-banner">{error}</div>}
            {loading && <div className="count">Đang tải…</div>}

            {ToolbarAlbums}

            <div className="thead">Danh sách album</div>
            <div style={{ marginLeft: "auto", opacity: 0.9 }}>
              <>
                Trang {albTotalPages ? albPage : 0}/{albTotalPages} • Tổng{" "}
                {albTotal} bản ghi
              </>
            </div>
            <div className="list" role="list">
              {AlbHeader}
              {albums.map((a) => (
                <div
                  key={a.id}
                  className={cx("albums-tr", "tr--albums")}
                  role="listitem"
                >
                  <div className="td td--name">
                    <a
                      className="link"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        openPhotos(a);
                      }}
                    >
                      {a.name}
                    </a>
                  </div>
                  <div className="td">{a.description ?? "—"}</div>
                  <div className="td">
                    {new Date(a.created_dt).toLocaleString()}
                  </div>
                  <div className="td">
                    {new Date(a.updated_dt).toLocaleString()}
                  </div>
                  <div
                    className="td td--actions"
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      className="button"
                      onClick={() => setEditingAlbum(a)}
                    >
                      Sửa
                    </button>
                    <button
                      className="button button--danger"
                      onClick={() => doDeleteAlbum(a)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination (Albums) */}
            {AlbPagination}
          </>
        ) : (
          <>
            {ToolbarPhotos(page.album)}

            <div className="thead">Danh sách hình ảnh</div>
            <div style={{ marginLeft: "auto", opacity: 0.9 }}>
              <>
                Trang {phTotalPages ? phPage : 0}/{phTotalPages} • Tổng{" "}
                {phTotalItems} bản ghi
              </>
            </div>
            <div className="list" role="list">
              {PhotosHeader}
              {photos.map((p, idx) => (
                <div
                  key={p.id}
                  className={cx("images-tr", "tr--images-photos")}
                  role="listitem"
                >
                  <div className="td td--name">
                    <a
                      href="#"
                      className="link"
                      onClick={(e) => {
                        e.preventDefault();
                        openLightbox(idx);
                      }}
                    >
                      {p.name}
                    </a>
                  </div>
                  <div className="td">{p.description ?? "—"}</div>
                  <div className="td">
                    {new Date(p.created_dt).toLocaleString()}
                  </div>
                  <div className="td">
                    {new Date(p.updated_dt).toLocaleString()}
                  </div>
                  <div
                    className="td td--actions"
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      className="button"
                      onClick={() => setEditingPhoto(p)}
                    >
                      Sửa
                    </button>
                    <button
                      className="button button--danger"
                      onClick={() => doDeletePhoto(page.album.id, p)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination (Photos, client-side) */}
            {PhPagination}
          </>
        )}
      </div>

      {/* Modals */}
      {showAddAlbum && (
        <AlbumFormModal
          title="Thêm Album"
          onSave={doCreateAlbum}
          onClose={() => setShowAddAlbum(false)}
        />
      )}
      {editingAlbum && (
        <AlbumFormModal
          title="Sửa Album"
          initial={editingAlbum}
          onSave={(payload) => doUpdateAlbum(editingAlbum, payload)}
          onClose={() => setEditingAlbum(null)}
        />
      )}

      {page.name === "photos" && showUpload && (
        <UploadPhotosModal
          album={page.album}
          onUploaded={async () => {
            setShowUpload(false);
            await loadPhotos(page.album.id);
            repaginatePhotos();
          }}
          onClose={() => setShowUpload(false)}
        />
      )}
      {page.name === "photos" && editingPhoto && (
        <EditPhotoModal
          albumId={page.album.id}
          photo={editingPhoto}
          onSaved={async () => {
            setEditingPhoto(null);
            await loadPhotos(page.album.id);
            repaginatePhotos();
          }}
          onClose={() => setEditingPhoto(null)}
        />
      )}

      {/* Lightbox xem ảnh */}
      {page.name === "photos" &&
        lightboxIndex !== null &&
        photos.length > 0 && (
          <Lightbox
            albumId={page.album.id}
            photos={photos}
            index={lightboxIndex}
            onClose={closeLightbox}
            onPrev={prevLightbox}
            onNext={nextLightbox}
          />
        )}
    </div>
  );
}
