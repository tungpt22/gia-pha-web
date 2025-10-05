import React, { useEffect, useMemo, useState } from "react";
import styles from "./FamilyTree.module.css";

// GIỮ API CŨ: trả về trực tiếp RawPersonRef[] (không .data)
import { fetchFamilyTree } from "../../api/familyTreeApi";

export interface RawPersonRef {
  id: string;
  name: string;
  relation?: string; // "Vợ" | "Chồng" | "Con" ...
  spouses?: RawPersonRef[];
  children?: RawPersonRef[];
}

/* Chọn gốc: ưu tiên "Cụ 1", sau đó node có (spouses + children) nhiều nhất */
function pickRoot(people: RawPersonRef[]): RawPersonRef | null {
  if (!people || people.length === 0) return null;
  const cue1 = people.find((p) => p.name === "Cụ 1");
  if (cue1) return cue1;
  let best = people[0];
  let bestScore = (best.spouses?.length ?? 0) + (best.children?.length ?? 0);
  for (const p of people) {
    const s = (p.spouses?.length ?? 0) + (p.children?.length ?? 0);
    if (s > bestScore) {
      best = p;
      bestScore = s;
    }
  }
  return best;
}

/* Ưu tiên nhãn Vợ/Chồng nếu có spouses, không thì mới dùng "Con" */
function computeRole(person: RawPersonRef): string | undefined {
  const mates = person.spouses ?? [];
  const hasWife = mates.some((m) =>
    (m.relation ?? "").toLowerCase().includes("vợ")
  );
  const hasHusband = mates.some((m) =>
    (m.relation ?? "").toLowerCase().includes("chồng")
  );
  if (hasWife) return "Chồng";
  if (hasHusband) return "Vợ";
  // không có vợ/chồng → có thể hiển thị "Con"
  if ((person.relation ?? "").toLowerCase().includes("con")) return "Con";
  // nếu bản thân có relation là Vợ/Chồng thì hiển thị luôn
  if ((person.relation ?? "").toLowerCase().includes("vợ")) return "Vợ";
  if ((person.relation ?? "").toLowerCase().includes("chồng")) return "Chồng";
  return undefined;
}

/* Gọi API chi tiết */
async function fetchUserDetail(userId: string) {
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  const res = await fetch(`http://localhost:3000/api/v1/users/${userId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Fetch detail failed: ${res.status}`);
  const json = await res.json();
  return json.data;
}

/* Thẻ hiển thị 1 người (không avatar) */
function PersonCard({
  person,
  onView,
}: {
  person: RawPersonRef;
  onView: (id: string) => void;
}) {
  const role = computeRole(person);
  return (
    <div className={styles.card} title={person.name}>
      <div className={styles.name}>{person.name}</div>
      <div className={styles.role}>{role ?? ""}</div>
      <button className={styles.view} onClick={() => onView(person.id)}>
        Xem
      </button>
    </div>
  );
}

/* 1 node: cụm vợ/chồng (ngang) + con (dọc) */
function RenderNode({
  node,
  onView,
}: {
  node: RawPersonRef;
  onView: (id: string) => void;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <li>
      <div
        className={`${styles.couple} ${hasChildren ? styles.hasChildren : ""}`}
      >
        <PersonCard person={node} onView={onView} />
        {(node.spouses ?? []).map((sp) => (
          <PersonCard key={sp.id} person={sp} onView={onView} />
        ))}
      </div>

      {hasChildren && (
        <ul>
          {(node.children ?? []).map((child) => (
            <RenderNode key={child.id} node={child} onView={onView} />
          ))}
        </ul>
      )}
    </li>
  );
}

/* Popup chi tiết */
function DetailModal({
  open,
  onClose,
  detail,
}: {
  open: boolean;
  onClose: () => void;
  detail: Partial<{
    id: string;
    name: string;
    gender: string;
    email: string;
    phone_number: string;
    address: string;
    birthday: string;
    death_day: string | null;
    profile_img: string | null;
  }> | null;
}) {
  if (!open) return null;
  const fullImg = detail?.profile_img
    ? `http://localhost:3000/${detail.profile_img}`
    : null;
  const status = detail?.death_day
    ? `Đã mất ngày ${detail.death_day}`
    : "Còn sống";

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
            {fullImg ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img src={fullImg} />
            ) : (
              <div className={styles.noImage}>Không có hình ảnh</div>
            )}
          </div>

          <div className={styles.modalInfo}>
            <div>
              <b>Họ tên:</b> {detail?.name ?? "—"}
            </div>
            <div>
              <b>Giới tính:</b> {detail?.gender ?? "—"}
            </div>
            <div>
              <b>Email:</b> {detail?.email ?? "—"}
            </div>
            <div>
              <b>Số điện thoại:</b> {detail?.phone_number ?? "—"}
            </div>
            <div>
              <b>Địa chỉ:</b> {detail?.address ?? "—"}
            </div>
            <div>
              <b>Ngày sinh:</b> {detail?.birthday ?? "—"}
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
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const people: RawPersonRef[] = await fetchFamilyTree(); // GIỮ cách gọi cũ
        if (!mounted) return;
        setRoot(pickRoot(people));
      } catch (e) {
        console.error("Lỗi tải family tree:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleView(id: string) {
    try {
      const d = await fetchUserDetail(id);
      setDetail(d);
      setOpenModal(true);
    } catch (e) {
      console.error(e);
      setDetail(null);
      setOpenModal(true);
    }
  }

  function nudge(dx: number, dy: number) {
    const scroller = document.querySelector<HTMLElement>(`.${styles.treeWrap}`);
    if (!scroller) return;
    scroller.scrollBy({ left: dx, top: dy, behavior: "smooth" });
  }

  if (loading) return <div>Đang tải cây…</div>;
  if (!root) return <div>Không có dữ liệu cây.</div>;

  return (
    <div className={styles.familyWrap}>
      <div className={styles.ftToolbar}>
        <span className={styles.ftZoomLabel}>Cây gia đình</span>
        <div className={styles.arrows}>
          <button onClick={() => nudge(-200, 0)}>◀</button>
          <button onClick={() => nudge(200, 0)}>▶</button>
          <button onClick={() => nudge(0, -200)}>▲</button>
          <button onClick={() => nudge(0, 200)}>▼</button>
        </div>
      </div>

      <div className={styles.treeWrap}>
        <div className={styles.ftCanvas}>
          <ul className={styles.geneTree}>
            <RenderNode node={root} onView={handleView} />
          </ul>
        </div>
      </div>

      <DetailModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        detail={detail}
      />
    </div>
  );
};

export default FamilyTree;
