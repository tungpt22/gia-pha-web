import React, { useEffect, useState } from "react";
import styles from "./FamilyTree.module.css";
import { fetchFamilyTree } from "./familyTreeApi";

export interface RawPersonRef {
  id: string;
  name: string;
  relation?: string;
  spouses?: RawPersonRef[];
  children?: RawPersonRef[];
}

/* --- chọn root: cây lớn nhất, nếu hòa thì ưu tiên tên 'Cụ 1' --- */
function collectIds(p: RawPersonRef, s: Set<string>) {
  if (s.has(p.id)) return;
  s.add(p.id);
  (p.spouses ?? []).forEach((m) => collectIds(m, s));
  (p.children ?? []).forEach((c) => collectIds(c, s));
}
function pickRoot(arr: RawPersonRef[]): RawPersonRef | null {
  if (!arr?.length) return null;
  const hasParent = new Set<string>();
  arr.forEach((p) => (p.children ?? []).forEach((c) => hasParent.add(c.id)));
  const candidates = arr.filter((p) => !hasParent.has(p.id));
  const list = candidates.length ? candidates : arr;

  let best = list[0];
  let bestSize = 0;
  for (const r of list) {
    const set = new Set<string>();
    collectIds(r, set);
    if (set.size > bestSize || (set.size === bestSize && r.name === "Cụ 1")) {
      best = r;
      bestSize = set.size;
    }
  }
  return best;
}

function roleOf(p: RawPersonRef): string | undefined {
  const sps = p.spouses ?? [];
  const hasWife = sps.some((m) =>
    (m.relation ?? "").toLowerCase().includes("vợ")
  );
  const hasHusband = sps.some((m) =>
    (m.relation ?? "").toLowerCase().includes("chồng")
  );
  if (hasWife) return "Chồng";
  if (hasHusband) return "Vợ";

  const rel = (p.relation ?? "").toLowerCase();
  if (rel.includes("vợ")) return "Vợ";
  if (rel.includes("chồng")) return "Chồng";
  if (rel.includes("con")) return "Con";
  return undefined;
}

/* detail API */
async function fetchUserDetail(id: string) {
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  const res = await fetch(`http://localhost:3000/api/v1/users/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const j = await res.json();
  return j?.data ?? null;
}

function PersonCard({
  p,
  onView,
}: {
  p: RawPersonRef;
  onView: (id: string) => void;
}) {
  return (
    <div className={styles.card} title={p.name}>
      <div className={styles.name}>{p.name}</div>
      <div className={styles.role}>{roleOf(p) ?? ""}</div>
      <button className={styles.view} onClick={() => onView(p.id)}>
        Xem
      </button>
    </div>
  );
}

function Node({
  n,
  onView,
}: {
  n: RawPersonRef;
  onView: (id: string) => void;
}) {
  const childCount = n.children?.length ?? 0;
  const hasChildren = childCount > 0;
  const hasOneChild = childCount === 1;

  return (
    <li>
      <div
        className={`${styles.couple} ${hasChildren ? styles.hasChildren : ""} ${
          hasOneChild ? styles.hasOneChild : ""
        }`}
      >
        <PersonCard p={n} onView={onView} />
        {(n.spouses ?? []).map((sp) => (
          <PersonCard key={sp.id} p={sp} onView={onView} />
        ))}
      </div>

      {hasChildren && (
        <ul className={hasOneChild ? styles.onlyOne : ""}>
          {(n.children ?? []).map((c) => (
            <Child key={c.id} n={c} onView={onView} />
          ))}
        </ul>
      )}
    </li>
  );
}

function Child({
  n,
  onView,
}: {
  n: RawPersonRef;
  onView: (id: string) => void;
}) {
  const childCount = n.children?.length ?? 0;
  const hasChildren = childCount > 0;
  const hasOneChild = childCount === 1;

  return (
    <li>
      <div className={`${styles.couple} ${styles.childCouple}`}>
        <PersonCard p={n} onView={onView} />
        {(n.spouses ?? []).map((sp) => (
          <PersonCard key={sp.id} p={sp} onView={onView} />
        ))}
      </div>

      {hasChildren && (
        <ul className={hasOneChild ? styles.onlyOne : ""}>
          {(n.children ?? []).map((c) => (
            <Child key={c.id} n={c} onView={onView} />
          ))}
        </ul>
      )}
    </li>
  );
}

/* Modal */
function Modal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: any;
}) {
  if (!open) return null;
  const img = data?.profile_img
    ? `http://localhost:3000/${data.profile_img}`
    : null;
  const status = data?.death_day ? `Đã mất ngày ${data.death_day}` : "Còn sống";
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>Thông tin thành viên</div>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalAvatar}>
            {img ? (
              <img src={img} alt="" />
            ) : (
              <div className={styles.noImage}>Không có hình ảnh</div>
            )}
          </div>
          <div className={styles.modalInfo}>
            <div>
              <b>Họ tên:</b> {data?.name ?? "—"}
            </div>
            <div>
              <b>Giới tính:</b> {data?.gender ?? "—"}
            </div>
            <div>
              <b>Email:</b> {data?.email ?? "—"}
            </div>
            <div>
              <b>Điện thoại:</b> {data?.phone_number ?? "—"}
            </div>
            <div>
              <b>Địa chỉ:</b> {data?.address ?? "—"}
            </div>
            <div>
              <b>Ngày sinh:</b> {data?.birthday ?? "—"}
            </div>
            <div>
              <b>Tình trạng:</b> {status}
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.view} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

const FamilyTree: React.FC = () => {
  const [root, setRoot] = useState<RawPersonRef | null>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const data: RawPersonRef[] = await fetchFamilyTree();
      if (!live) return;
      setRoot(pickRoot(data));
    })();
    return () => {
      live = false;
    };
  }, []);

  const onView = async (id: string) => {
    const d = await fetchUserDetail(id);
    setDetail(d);
    setOpen(true);
  };

  if (!root) return <div>Đang tải dữ liệu cây.</div>;

  return (
    <div className={styles.familyWrap}>
      <div className={styles.ftToolbar}>
        <span className={styles.ftZoomLabel}>Cây gia đình</span>
        <div className={styles.arrows}>
          <button
            onClick={() =>
              document
                .querySelector(`.${styles.treeWrap}`)
                ?.scrollBy({ left: -220, behavior: "smooth" })
            }
          >
            ◀
          </button>
          <button
            onClick={() =>
              document
                .querySelector(`.${styles.treeWrap}`)
                ?.scrollBy({ left: 220, behavior: "smooth" })
            }
          >
            ▶
          </button>
          <button
            onClick={() =>
              document
                .querySelector(`.${styles.treeWrap}`)
                ?.scrollBy({ top: -220, behavior: "smooth" })
            }
          >
            ▲
          </button>
          <button
            onClick={() =>
              document
                .querySelector(`.${styles.treeWrap}`)
                ?.scrollBy({ top: 220, behavior: "smooth" })
            }
          >
            ▼
          </button>
        </div>
      </div>

      <div className={styles.treeWrap}>
        <div className={styles.ftCanvas}>
          <ul className={styles.geneTree}>
            <Node n={root} onView={onView} />
          </ul>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} data={detail} />
    </div>
  );
};

export default FamilyTree;
