import React from "react";
import "./Awards.css";

type Award = {
  id: string;
  name: string;
  person: string;
  year: string;
  desc?: string;
};
const seed: Award[] = [
  {
    id: "k1",
    name: "Học sinh giỏi Quốc gia",
    person: "Nguyễn Văn D",
    year: "2024",
    desc: "Thành tích xuất sắc",
  },
];

export default function Awards() {
  const [list, setList] = React.useState<Award[]>(seed);
  const [edit, setEdit] = React.useState<Award | undefined>(list[0]);
  const [q, setQ] = React.useState("");

  const filtered = list.filter((k) =>
    (k.name + k.person).toLowerCase().includes(q.toLowerCase())
  );
  const save = () => {
    if (!edit) return;
    setList((prev) =>
      prev.some((x) => x.id === edit.id)
        ? prev.map((x) => (x.id === edit.id ? edit : x))
        : [...prev, { ...edit, id: "k" + (prev.length + 1) }]
    );
  };
  const remove = (id: string) =>
    setList((prev) => prev.filter((x) => x.id !== id));

  return (
    <section className="section">
      <div className="container">
        <div className="badge">QUẢN LÝ KHEN THƯỞNG</div>
        <div className="agrid agrid-2">
          <div className="acard shadow-card">
            <div className="toolbar" style={{ marginBottom: 12 }}>
              <input
                placeholder="Tìm theo tên/ người nhận..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                className="button button--primary"
                onClick={() =>
                  setEdit({ id: "", name: "", person: "", year: "" })
                }
              >
                + Thêm
              </button>
            </div>
            <div className="list">
              {filtered.map((k) => (
                <div className="tr" key={k.id}>
                  <div>{k.name}</div>
                  <div>{k.person}</div>
                  <div>{k.year}</div>
                  <div
                    className="actions"
                    style={{ justifyContent: "flex-end" }}
                  >
                    <button className="button" onClick={() => setEdit(k)}>
                      Sửa
                    </button>
                    <button className="button" onClick={() => remove(k.id)}>
                      Xoá
                    </button>
                    <button
                      className="button button--primary"
                      onClick={() => alert(JSON.stringify(k, null, 2))}
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="acard shadow-card">
            <h3 style={{ marginTop: 0 }}>Thêm / Sửa khen thưởng</h3>
            {edit && (
              <div className="form">
                <div className="row">
                  <div>
                    <label>Tên khen thưởng</label>
                    <input
                      value={edit.name}
                      onChange={(e) =>
                        setEdit({ ...edit, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>Người nhận</label>
                    <input
                      value={edit.person}
                      onChange={(e) =>
                        setEdit({ ...edit, person: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="row">
                  <div>
                    <label>Năm</label>
                    <input
                      value={edit.year}
                      onChange={(e) =>
                        setEdit({ ...edit, year: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label>Mô tả</label>
                  <textarea
                    rows={3}
                    value={edit.desc || ""}
                    onChange={(e) => setEdit({ ...edit, desc: e.target.value })}
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
