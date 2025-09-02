import React from "react";
import "./Media.css";

type Folder = { id: string; name: string; year?: string; event?: string };
type Image = { id: string; url: string; folderId: string; title?: string };

const seedFolders: Folder[] = [
  { id: "f2024", name: "Ảnh 2024", year: "2024" },
  { id: "fLeGio", name: "Lễ giỗ 2025", year: "2025", event: "Lễ giỗ" },
];
const seedImages: Image[] = [
  {
    id: "i1",
    url: "https://picsum.photos/seed/1/800/600",
    folderId: "f2024",
    title: "Ảnh 1",
  },
  {
    id: "i2",
    url: "https://picsum.photos/seed/2/800/600",
    folderId: "f2024",
    title: "Ảnh 2",
  },
  {
    id: "i3",
    url: "https://picsum.photos/seed/3/800/600",
    folderId: "fLeGio",
    title: "Ảnh lễ",
  },
];

export default function Media() {
  const [folders, setFolders] = React.useState<Folder[]>(seedFolders);
  const [images, setImages] = React.useState<Image[]>(seedImages);
  const [cur, setCur] = React.useState<Folder | undefined>(folders[0]);

  const addFolder = () =>
    setFolders((prev) => [
      ...prev,
      { id: "f" + (prev.length + 1), name: "Folder mới" },
    ]);
  const saveFolder = (f: Folder) =>
    setFolders((prev) => prev.map((x) => (x.id === f.id ? f : x)));
  const removeFolder = (id: string) => {
    setFolders((prev) => prev.filter((x) => x.id !== id));
    setImages((prev) => prev.filter((i) => i.folderId !== id));
    if (cur?.id === id) setCur(undefined);
  };

  const imgs = images.filter((i) => i.folderId === cur?.id);

  return (
    <section className="section">
      <div className="container">
        <div className="badge">QUẢN LÝ HÌNH ẢNH / TÀI LIỆU</div>
        <div className="agrid agrid-2">
          <div className="acard shadow-card">
            <div className="toolbar" style={{ marginBottom: 12 }}>
              <button className="button button--primary" onClick={addFolder}>
                + Tạo folder
              </button>
            </div>
            <div className="list">
              {folders.map((f) => (
                <div
                  className="folder"
                  key={f.id}
                  onClick={() => setCur(f)}
                  style={{ cursor: "pointer" }}
                >
                  <strong style={{ flex: 1 }}>{f.name}</strong>
                  <span>{f.year || "-"}</span>
                  <span>{f.event || "-"}</span>
                  <div className="actions" style={{ marginLeft: "auto" }}>
                    <button
                      className="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        saveFolder({ ...f, name: f.name + " (sửa)" });
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      className="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFolder(f.id);
                      }}
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="acard shadow-card">
            <h3 style={{ marginTop: 0 }}>Cập nhật folder</h3>
            {cur ? (
              <div className="form">
                <div className="row">
                  <div>
                    <label>Tên folder</label>
                    <input
                      value={cur.name}
                      onChange={(e) => setCur({ ...cur, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Năm</label>
                    <input
                      value={cur.year || ""}
                      onChange={(e) => setCur({ ...cur, year: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label>Sự kiện</label>
                  <input
                    value={cur.event || ""}
                    onChange={(e) => setCur({ ...cur, event: e.target.value })}
                  />
                </div>
                <div className="actions">
                  <button
                    className="button button--primary"
                    onClick={() => cur && saveFolder(cur)}
                  >
                    Lưu folder
                  </button>
                </div>

                <div style={{ marginTop: 16 }} className="toolbar">
                  <button
                    className="button"
                    onClick={() =>
                      setImages((prev) => [
                        ...prev,
                        {
                          id: "i" + (prev.length + 1),
                          url:
                            "https://picsum.photos/seed/" +
                            (prev.length + 1) +
                            "/800/600",
                          folderId: cur.id,
                          title: "Ảnh mới",
                        },
                      ])
                    }
                  >
                    + Thêm ảnh
                  </button>
                </div>
                <div className="grid" style={{ marginTop: 10 }}>
                  {imgs.map((img) => (
                    <div className="thumb" key={img.id}>
                      <img src={img.url} alt="" />
                      <div
                        style={{ padding: "8px 10px", display: "flex", gap: 8 }}
                      >
                        <input
                          style={{ flex: 1 }}
                          value={img.title || ""}
                          onChange={(e) =>
                            setImages((prev) =>
                              prev.map((x) =>
                                x.id === img.id
                                  ? { ...x, title: e.target.value }
                                  : x
                              )
                            )
                          }
                        />
                        <button
                          className="button"
                          onClick={() =>
                            setImages((prev) =>
                              prev.filter((x) => x.id !== img.id)
                            )
                          }
                        >
                          Xoá
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              "Chọn folder ở cột trái"
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
