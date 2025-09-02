import React from "react";
import "./Finance.css";

type Tx = {
  id: string;
  date: string;
  type: "Thu" | "Chi";
  amount: number;
  title: string;
  note?: string;
};
const seed: Tx[] = [
  {
    id: "t1",
    date: "2025-07-01",
    type: "Thu",
    amount: 5000000,
    title: "Đóng góp xây dựng",
  },
  {
    id: "t2",
    date: "2025-07-10",
    type: "Chi",
    amount: 1500000,
    title: "Mua vật tư",
  },
];

export default function Finance() {
  const [list, setList] = React.useState<Tx[]>(seed);
  const [edit, setEdit] = React.useState<Tx | undefined>(list[0]);
  const [q, setQ] = React.useState("");

  const filtered = list.filter((t) =>
    t.title.toLowerCase().includes(q.toLowerCase())
  );
  const save = () => {
    if (!edit) return;
    setList((prev) =>
      prev.some((x) => x.id === edit.id)
        ? prev.map((x) => (x.id === edit.id ? edit : x))
        : [...prev, { ...edit, id: "t" + (prev.length + 1) }]
    );
  };
  const remove = (id: string) =>
    setList((prev) => prev.filter((x) => x.id !== id));
  const fmt = (n: number) => n.toLocaleString("vi-VN");

  return (
    <section className="section">
      <div className="container">
        <div className="badge">QUẢN LÝ THU CHI</div>
        <div className="agrid agrid-2">
          <div className="acard shadow-card">
            <div className="toolbar" style={{ marginBottom: 12 }}>
              <input
                placeholder="Tìm khoản thu/chi..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                className="button button--primary"
                onClick={() =>
                  setEdit({
                    id: "",
                    date: "",
                    type: "Thu",
                    amount: 0,
                    title: "",
                  })
                }
              >
                + Thêm
              </button>
            </div>
            <div className="thead">Danh sách</div>
            <div className="list">
              {filtered.map((t) => (
                <div className="tr" key={t.id}>
                  <div>{t.title}</div>
                  <div>{t.date}</div>
                  <div>
                    {t.type} · {fmt(t.amount)}₫
                  </div>
                  <div style={{ textAlign: "right" }} className="actions">
                    <button className="button" onClick={() => setEdit(t)}>
                      Sửa
                    </button>
                    <button className="button" onClick={() => remove(t.id)}>
                      Xoá
                    </button>
                    <button
                      className="button button--primary"
                      onClick={() => alert(JSON.stringify(t, null, 2))}
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="acard shadow-card">
            <h3 style={{ marginTop: 0 }}>Thêm / Sửa khoản</h3>
            {edit && (
              <div className="form">
                <div className="row">
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
                  <div>
                    <label>Loại</label>
                    <select
                      value={edit.type}
                      onChange={(e) =>
                        setEdit({ ...edit, type: e.target.value as any })
                      }
                    >
                      <option>Thu</option>
                      <option>Chi</option>
                    </select>
                  </div>
                </div>
                <div className="row">
                  <div>
                    <label>Số tiền</label>
                    <input
                      type="number"
                      value={edit.amount}
                      onChange={(e) =>
                        setEdit({ ...edit, amount: +e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>Tiêu đề</label>
                    <input
                      value={edit.title}
                      onChange={(e) =>
                        setEdit({ ...edit, title: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label>Ghi chú</label>
                  <textarea
                    rows={3}
                    value={edit.note || ""}
                    onChange={(e) => setEdit({ ...edit, note: e.target.value })}
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
