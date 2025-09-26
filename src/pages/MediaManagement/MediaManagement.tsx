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
} from "../../api/albumApi.ts";

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

/** ===== Lightbox xem ảnh (mới thêm theo yêu cầu) ===== */
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
  // Đường dẫn ảnh theo yêu cầu: uploads\albums\{id album}\{id ảnh}
  // Dùng slash forward để trình duyệt load static đúng.
  const src = `/uploads/albums/${albumId}/${photo.id}`;

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

export default function MediaManagement() {
  // Trang mặc định là Albums (đã bỏ select “Chọn loại”/“Album”)
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
        setAlbums(res.data.data);
        setAlbTotal(res.data.total);
        setAlbTotalPages(res.data.totalPages);
      } catch (e: any) {
        setError(e?.message || "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    },
    [albLimit]
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

  const openPhotos = (album: AlbumDto) => setPage({ name: "photos", album });

  // ===== Photos state =====
  const [allPhotos, setAllPhotos] = React.useState<PhotoDto[]>([]);
  const [photos, setPhotos] = React.useState<PhotoDto[]>([]);
  const [phPage, setPhPage] = React.useState(1);
  const [phLimit] = React.useState(10);
  const [phTotalPages, setPhTotalPages] = React.useState(1);
  const [phQ, setPhQ] = React.useState("");
  const [showUpload, setShowUpload] = React.useState(false);
  const [editingPhoto, setEditingPhoto] = React.useState<PhotoDto | null>(null);

  const loadPhotos = React.useCallback(async (albumId: string) => {
    const res = await listPhotos(albumId);
    setAllPhotos(res.data.data);
  }, []);

  // Lọc + phân trang ảnh (client-side vì API list ảnh chưa có page/limit/search)
  const repaginatePhotos = React.useCallback(() => {
    const filtered = phQ.trim()
      ? allPhotos.filter((p) =>
          `${p.name} ${p.description ?? ""}`
            .toLowerCase()
            .includes(phQ.trim().toLowerCase())
        )
      : allPhotos;
    const totalPages = Math.max(1, Math.ceil(filtered.length / phLimit));
    const safePage = Math.min(phPage, totalPages);
    const start = (safePage - 1) * phLimit;
    setPhTotalPages(totalPages);
    setPhPage(safePage);
    setPhotos(filtered.slice(start, start + phLimit));
  }, [allPhotos, phQ, phPage, phLimit]);

  React.useEffect(() => {
    if (page.name === "photos") loadPhotos(page.album.id);
  }, [page, loadPhotos]);
  React.useEffect(() => {
    if (page.name === "photos") repaginatePhotos();
  }, [page, allPhotos, phPage, phQ, repaginatePhotos]);

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

  // ===== Lightbox state (mới) =====
  // Duyệt trong danh sách ảnh đang hiển thị (photos) để không ảnh hưởng phân trang hiện tại
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
      {/* ĐÃ BỎ: label & selectbox Chọn loại + Album */}
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
            setPhPage(1);
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
      <div className="th">
        <span>Tên</span>
      </div>
      <div className="th">
        <span>Mô tả</span>
      </div>
      <div className="th">
        <span>Ngày tạo</span>
      </div>
      <div className="th">
        <span>Ngày cập nhật</span>
      </div>
      <div style={{ textAlign: "right" }}>Thao tác</div>
    </div>
  );

  const PhotosHeader = (
    <div
      className={cx("images-tr", "tr--head", "tr--images-photos")}
      role="presentation"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="th">
        <span>Tên ảnh</span>
      </div>
      <div className="th">
        <span>Mô tả</span>
      </div>
      <div className="th">
        <span>Ngày tạo</span>
      </div>
      <div className="th">
        <span>Ngày cập nhật</span>
      </div>
      <div style={{ textAlign: "right" }}>Thao tác</div>
    </div>
  );

  return (
    <div className="gallery-wrap">
      <div className="card">
        <div className="page-head">
          <div className="page-title">Quản lý album & hình ảnh</div>
        </div>

        {page.name === "albums" ? ToolbarAlbums : ToolbarPhotos(page.album)}

        {page.name === "albums" && (
          <>
            {error && <div className="search-empty-banner">{error}</div>}
            {loading && <div className="count">Đang tải…</div>}
            <div className="count">Tìm thấy {albTotal} kết quả</div>

            <div className="thead">Danh sách album</div>
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
              <span className="page-ellipsis">
                Trang {albPage}/{albTotalPages}
              </span>
              <button
                className="page-btn"
                disabled={albPage >= albTotalPages}
                onClick={() =>
                  setAlbPage((p) => Math.min(albTotalPages, p + 1))
                }
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
          </>
        )}

        {page.name === "photos" && (
          <>
            <div className="thead">Danh sách hình ảnh</div>
            <div className="list" role="list">
              {PhotosHeader}
              {photos.map((p, idx) => (
                <div
                  key={p.id}
                  className={cx("images-tr", "tr--images-photos")}
                  role="listitem"
                >
                  <div className="td td--name">
                    {/* MỚI: tên ảnh là link mở lightbox */}
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
              <span className="page-ellipsis">
                Trang {phPage}/{phTotalPages}
              </span>
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

      {/* MỚI: Lightbox xem ảnh */}
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
