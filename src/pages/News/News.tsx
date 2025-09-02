import React from "react";
import "./News.css";

type News = {
  id: string;
  title: string;
  date: string;
  excerpt?: string;
  content?: string;
};
const seed: News[] = [
  {
    id: "n1",
    title: "Thông báo họp họ",
    date: "2025-08-01",
    excerpt: "Mời các con cháu tham dự",
  },
  {
    id: "n2",
    title: "Khen thưởng học sinh giỏi",
    date: "2025-07-10",
    excerpt: "Tuyên dương các cháu",
  },
];

export default function News() {
  const [list, setList] = React.useState<News[]>(seed);
  const [edit, setEdit] = React.useState<News | undefined>(list[0]);
  const [q, setQ] = React.useState("");

  const filtered = list.filter((n) =>
    n.title.toLowerCase().includes(q.toLowerCase())
  );
  const save = () => {
    if (!edit) return;
    setList((prev) =>
      prev.some((x) => x.id === edit.id)
        ? prev.map((x) => (x.id === edit.id ? edit : x))
        : [...prev, { ...edit, id: "n" + (prev.length + 1) }]
    );
  };
  const remove = (id: string) =>
    setList((prev) => prev.filter((x) => x.id !== id));

  return (
    <section className="section">
      <div className="container">
        <div className="badge">QUẢN LÝ TIN TỨC</div>
        <div className="agrid agrid-2">
          <div className="acard shadow-card">
            <div className="toolbar" style={{ marginBottom: 12 }}>
              <input
                placeholder="Tìm bài..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                className="button button--primary"
                onClick={() => setEdit({ id: "", title: "", date: "" })}
              >
                + Thêm
              </button>
            </div>
            <div className="list">
              {filtered.map((n) => (
                <div className="tr" key={n.id}>
                  <div>{n.title}</div>
                  <div>{n.date}</div>
                  <div>{n.excerpt || "-"}</div>
                  <div
                    className="actions"
                    style={{ justifyContent: "flex-end" }}
                  >
                    <button className="button" onClick={() => setEdit(n)}>
                      Sửa
                    </button>
                    <button className="button" onClick={() => remove(n.id)}>
                      Xoá
                    </button>
                    <button
                      className="button button--primary"
                      onClick={() => alert(JSON.stringify(n, null, 2))}
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="acard shadow-card">
            <h3 style={{ marginTop: 0 }}>Thêm / Sửa tin tức</h3>
            {edit && (
              <div className="form">
                <div className="row">
                  <div>
                    <label>Tiêu đề</label>
                    <input
                      value={edit.title}
                      onChange={(e) =>
                        setEdit({ ...edit, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>Ngày</label>
                    <input
                      type="date"
                      value={edit.date}
                      onChange={(e) =>
                        setEdit({ ...edit, date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label>Tóm tắt</label>
                  <input
                    value={edit.excerpt || ""}
                    onChange={(e) =>
                      setEdit({ ...edit, excerpt: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>Nội dung</label>
                  <textarea
                    rows={5}
                    value={edit.content || ""}
                    onChange={(e) =>
                      setEdit({ ...edit, content: e.target.value })
                    }
                  />
                </div>
                <div className="actions">
                  <button className="button button--primary" onClick={save}>
                    Lưu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
