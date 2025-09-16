import * as React from "react";
import "./CayPhaHe.css";

/* ===== Types ===== */
export type Gender = "Nam" | "Nữ";
export type Person = {
  id: string;
  name: string;
  gender: Gender;
  dob?: string;
  dod?: string;
  photoUrl?: string;
  fatherId?: string;
  motherId?: string;
  spouseIds?: string[];
  isRoot?: boolean;
};

type Props = {
  data: Person[];
  rootId?: string;
  title?: string;
};

/* ===== Helpers ===== */
const cx = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ");

function indexPeople(arr: Person[]) {
  const db: Record<string, Person> = {};
  for (const p of arr)
    db[p.id] = { ...p, spouseIds: Array.from(new Set(p.spouseIds || [])) };
  // bảo đảm spouse 2 chiều
  for (const p of Object.values(db)) {
    for (const sid of p.spouseIds || []) {
      const s = db[sid];
      if (s) s.spouseIds = Array.from(new Set([...(s.spouseIds || []), p.id]));
    }
  }
  return db;
}

const childrenOfCouple = (db: Record<string, Person>, a: Person, b?: Person) =>
  Object.values(db).filter((c) =>
    b
      ? (c.fatherId === a.id && c.motherId === b.id) ||
        (c.motherId === a.id && c.fatherId === b.id)
      : c.fatherId === a.id || c.motherId === a.id
  );

/** Đơn vị cặp để render: [p, spouse]. Nếu có con mà không rõ spouse -> thêm [p, undefined] */
function buildUnits(
  db: Record<string, Person>,
  p: Person
): Array<[Person, Person | undefined]> {
  const spouses = (p.spouseIds || [])
    .map((id) => db[id])
    .filter(Boolean) as Person[];
  const units: Array<[Person, Person | undefined]> = spouses.length
    ? spouses.map((s) => [p, s])
    : [[p, undefined]];

  const hasUnknownSpouseChild = Object.values(db).some(
    (c) =>
      (c.fatherId === p.id || c.motherId === p.id) &&
      (!c.fatherId || !c.motherId)
  );
  if (hasUnknownSpouseChild && spouses.length) units.push([p, undefined]);
  return units;
}

/* ===== UI pieces ===== */
function PersonCard({ p, onOpen }: { p: Person; onOpen: (p: Person) => void }) {
  return (
    <div
      className="tb-node"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(p)}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) =>
        e.key === "Enter" && onOpen(p)
      }
      title={p.name}
    >
      <div className="tb-photo">
        {p.photoUrl ? (
          <img src={p.photoUrl} alt={p.name} />
        ) : (
          <div className="tb-no-photo" />
        )}
      </div>
      <div className="tb-name" title={p.name}>
        {p.name}
      </div>
      <div className="tb-actions">
        <button
          className="tb-link"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(p);
          }}
        >
          Xem
        </button>
      </div>
    </div>
  );
}

function ViewModal({
  person,
  onClose,
}: {
  person: Person;
  onClose: () => void;
}) {
  return (
    <div className="tb-modal-backdrop" onClick={onClose}>
      <div className="tb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tb-modal-head">
          <div className="tb-modal-title">Thông tin</div>
          <button className="tb-btn tb-btn--ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="tb-modal-body">
          <div className="tb-info">
            <div>
              <b>Họ tên:</b> {person.name}
            </div>
            <div>
              <b>Giới tính:</b> {person.gender}
            </div>
            <div>
              <b>Ngày sinh:</b> {person.dob || "-"}
            </div>
            <div>
              <b>Ngày mất:</b> {person.dod || "-"}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button className="tb-btn" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoupleBox({
  a,
  b,
  all,
  onOpen,
  collapseAfter = 6,
}: {
  a: Person;
  b?: Person;
  all: Record<string, Person>;
  onOpen: (p: Person) => void;
  collapseAfter?: number;
}) {
  const kids = React.useMemo(() => childrenOfCouple(all, a, b), [all, a, b]);
  const [expanded, setExpanded] = React.useState(false);
  const visibleKids = expanded ? kids : kids.slice(0, collapseAfter);
  const showMore = kids.length > collapseAfter && !expanded;

  return (
    <li>
      <div className="tb-couple">
        <PersonCard p={a} onOpen={onOpen} />
        {b && <PersonCard p={b} onOpen={onOpen} />}
      </div>

      {kids.length > 0 && (
        <ul>
          {visibleKids.map((child) =>
            buildUnits(all, child).map(([c, sp]) => (
              <CoupleBox
                key={`${c.id}-${sp?.id || "nil"}`}
                a={c}
                b={sp}
                all={all}
                onOpen={onOpen}
              />
            ))
          )}
          {showMore && (
            <li className="tb-see-more">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setExpanded(true);
                }}
              >
                Xem thêm
              </a>
            </li>
          )}
        </ul>
      )}
    </li>
  );
}

/* ===== Main ===== */
export default function TreeBasic({
  data,
  rootId,
  title = "Cây phả hệ",
}: Props) {
  const db = React.useMemo(() => indexPeople(data), [data]);

  // chọn root: ưu tiên rootId -> isRoot -> không có cha mẹ -> phần tử đầu
  const root = React.useMemo(() => {
    const byId = (id?: string) => (id ? db[id] : undefined);
    return (
      byId(rootId) ||
      data.find((p) => p.isRoot) ||
      data.find((p) => !p.fatherId && !p.motherId) ||
      data[0]
    );
  }, [db, data, rootId]);

  const [viewing, setViewing] = React.useState<Person | null>(null);

  // zoom + pan
  const [scale, setScale] = React.useState(1);
  const clamp = (v: number, a: number, b: number) =>
    Math.max(a, Math.min(b, v));
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setScale((s) => clamp(s + (e.deltaY > 0 ? -0.05 : 0.05), 0.5, 2.2));
  };

  const viewRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const drag = React.useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = viewRef.current!;
    drag.current = {
      x: e.pageX - el.offsetLeft,
      y: e.pageY - el.offsetTop,
      sx: el.scrollLeft,
      sy: el.scrollTop,
    };
    setDragging(true);
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) return;
    e.preventDefault();
    const el = viewRef.current!;
    el.scrollLeft =
      drag.current.sx - (e.pageX - el.offsetLeft - drag.current.x);
    el.scrollTop = drag.current.sy - (e.pageY - el.offsetTop - drag.current.y);
  };
  const endDrag = () => setDragging(false);

  if (!root) return null;
  const rootUnits = React.useMemo(() => buildUnits(db, root), [db, root]);

  return (
    <div className="tb-wrap">
      <div className="tb-toolbar">
        <div className="tb-title">{title}</div>
        <div className="tb-spacer" />
        <button
          className="tb-btn"
          onClick={() => setScale((s) => clamp(s + 0.1, 0.5, 2.2))}
        >
          +
        </button>
        <button
          className="tb-btn"
          onClick={() => setScale((s) => clamp(s - 0.1, 0.5, 2.2))}
        >
          -
        </button>
        <div className="tb-zoom">{Math.round(scale * 100)}%</div>
      </div>

      <div
        ref={viewRef}
        className={cx("tb-viewport", dragging && "is-dragging")}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        <div
          className="tb-tree"
          style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}
        >
          <ul className="tb-root">
            <li>
              <div className="tb-couple tb-root-person">
                <PersonCard p={root} onOpen={setViewing} />
              </div>
              <ul>
                {rootUnits.map(([a, b], i) => (
                  <CoupleBox
                    key={`${a.id}-${b?.id || i}`}
                    a={a}
                    b={b}
                    all={db}
                    onOpen={setViewing}
                  />
                ))}
              </ul>
            </li>
          </ul>
        </div>
      </div>

      {viewing && (
        <ViewModal person={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
