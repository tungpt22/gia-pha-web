import React from "react";
import "./Events.css";

type Event = {
  id: string;
  title: string;
  time: string;
  place?: string;
  desc?: string;
};
const seed: Event[] = [
  {
    id: "e1",
    title: "Lễ giỗ Tổ",
    time: "2025-10-10 08:00",
    place: "Nhà thờ họ",
    desc: "Chuẩn bị lễ vật và sắp xếp chỗ ngồi",
  },
  {
    id: "e2",
    title: "Họp mặt cuối năm",
    time: "2025-12-20 18:00",
    place: "Nhà văn hoá thôn",
    desc: "Tổng kết năm và trao khen thưởng",
  },
];

export default function Events() {
  const [list, setList] = React.useState<Event[]>(seed);
  const [edit, setEdit] = React.useState<Event | undefined>(list[0]);
  const [q, setQ] = React.useState("");

  const filtered = list.filter((e) =>
    e.title.toLowerCase().includes(q.toLowerCase())
  );

  const save = () => {
    if (!edit) return;
    setList((prev) =>
      prev.some((x) => x.id === edit.id)
        ? prev.map((x) => (x.id === edit.id ? edit : x))
        : [...prev, { ...edit, id: "e" + (prev.length + 1) }]
    );
  };
  const remove = (id: string) =>
    setList((prev) => prev.filter((x) => x.id !== id));

  return (
    <section className="section">
      <div className="container">
        <div className="badge">QUẢN LÝ SỰ KIỆN</div>
        <div className="agrid agrid-2">
          <div className="acard shadow-card">
            <div className="toolbar" style={{ marginBottom: 12 }}>
              <input
                placeholder="Tìm sự kiện..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                className="button button--primary"
                onClick={() => setEdit({ id: "", title: "", time: "" })}
              >
                + Thêm
              </button>
            </div>
            <div className="list">
              {filtered.map((ev) => (
                <div className="tr" key={ev.id}>
                  <div>{ev.title}</div>
                  <div>{ev.time}</div>
                  <div>{ev.place || "-"}</div>
                  <div style={{ textAlign: "right" }}>
                    <div className="actions">
                      <button className="button" onClick={() => setEdit(ev)}>
                        Sửa
                      </button>
                      <button className="button" onClick={() => remove(ev.id)}>
                        Xoá
                      </button>
                      <button
                        className="button button--primary"
                        onClick={() => alert(JSON.stringify(ev, null, 2))}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="acard shadow-card">
            <h3 style={{ marginTop: 0 }}>Thêm / Sửa sự kiện</h3>
            {edit ? (
              <div className="form">
                <div>
                  <label>Tiêu đề</label>
                  <input
                    value={edit.title}
                    onChange={(e) =>
                      setEdit({ ...edit!, title: e.target.value })
                    }
                  />
                </div>
                <div className="row">
                  <div>
                    <label>Thời gian</label>
                    <input
                      value={edit.time}
                      onChange={(e) =>
                        setEdit({ ...edit!, time: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>Địa điểm</label>
                    <input
                      value={edit.place || ""}
                      onChange={(e) =>
                        setEdit({ ...edit!, place: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label>Mô tả</label>
                  <textarea
                    rows={3}
                    value={edit.desc || ""}
                    onChange={(e) =>
                      setEdit({ ...edit!, desc: e.target.value })
                    }
                  />
                </div>
                <div className="actions">
                  <button className="button button--primary" onClick={save}>
                    Lưu
                  </button>
                </div>
              </div>
            ) : (
              "Chọn sự kiện để chỉnh sửa"
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
