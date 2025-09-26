import React, { useEffect, useMemo, useRef, useState } from "react";
import "./FamilyTree.css";
import { fetchFamilyTree, type RawPerson } from "../../api/familyTreeApi";
import { getUserById, type UserDetail } from "../../api/usersApi";

/** ===== Types ===== */
type Person = {
  id: string;
  name: string;
  avatarUrl?: string;
  gender?: string | null;
};
type Graph = {
  persons: Map<string, Person>;
  childrenOf: Map<string, Set<string>>;
  parentsOf: Map<string, Set<string>>;
  spousesOf: Map<string, Set<string>>;
  undirectedAdj: Map<string, Set<string>>;
  parentCount: Map<string, number>;
  relLabel: Map<string, Map<string, string>>;
};

/** ===== Helpers ===== */
const addToSetMap = (m: Map<string, Set<string>>, k: string, v: string) => {
  if (!m.has(k)) m.set(k, new Set());
  m.get(k)!.add(v);
};
const setRel = (m: Graph["relLabel"], u: string, v: string, label?: string) => {
  if (!label) return;
  if (!m.has(u)) m.set(u, new Map());
  m.get(u)!.set(v, label);
};
const ensurePerson = (
  g: Graph,
  rp: Partial<RawPerson> & { id: string; name?: string }
) => {
  const ex = g.persons.get(rp.id);
  const gender = rp.gender ?? ex?.gender ?? null;
  const name = rp.name || ex?.name || rp.id;
  g.persons.set(rp.id, {
    id: rp.id,
    name,
    avatarUrl:
      (rp as any).profile_img || (rp as any).avatarUrl || ex?.avatarUrl,
    gender,
  });
};

function buildGraphRecursive(rows: RawPerson[]): Graph {
  const g: Graph = {
    persons: new Map(),
    childrenOf: new Map(),
    parentsOf: new Map(),
    spousesOf: new Map(),
    undirectedAdj: new Map(),
    parentCount: new Map(),
    relLabel: new Map(),
  };
  const seenSp = new Set<string>();
  const seenPar = new Set<string>();
  const seenCtx = new Set<string>();
  const keyU = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const keyD = (p: string, c: string) => `${p}->${c}`;
  const ctxKey = (id: string, parentId?: string) => `${id}|${parentId ?? ""}`;

  const walk = (node?: RawPerson | null, parentId?: string) => {
    if (!node) return;
    ensurePerson(g, node);

    const ck = ctxKey(node.id, parentId);
    if (seenCtx.has(ck)) return;
    seenCtx.add(ck);

    if (parentId) {
      const kd = keyD(parentId, node.id);
      if (!seenPar.has(kd)) {
        seenPar.add(kd);
        addToSetMap(g.childrenOf, parentId, node.id);
        addToSetMap(g.parentsOf, node.id, parentId);
        addToSetMap(g.undirectedAdj, parentId, node.id);
        addToSetMap(g.undirectedAdj, node.id, parentId);
        g.parentCount.set(node.id, (g.parentCount.get(node.id) ?? 0) + 1);
        setRel(g.relLabel, parentId, node.id, (node as any).relation);
      }
    }

    for (const s of node.spouses ?? []) {
      ensurePerson(g, s);
      const ku = keyU(node.id, s.id);
      if (!seenSp.has(ku)) {
        seenSp.add(ku);
        addToSetMap(g.spousesOf, node.id, s.id);
        addToSetMap(g.spousesOf, s.id, node.id);
        addToSetMap(g.undirectedAdj, node.id, s.id);
        addToSetMap(g.undirectedAdj, s.id, node.id);
        setRel(g.relLabel, node.id, s.id, (s as any).relation);
        setRel(g.relLabel, s.id, node.id, (node as any).relation);
      }
      walk(s);
    }

    for (const c of node.children ?? []) {
      ensurePerson(g, c);
      const kd = keyD(node.id, c.id);
      if (!seenPar.has(kd)) {
        seenPar.add(kd);
        addToSetMap(g.childrenOf, node.id, c.id);
        addToSetMap(g.parentsOf, c.id, node.id);
        addToSetMap(g.undirectedAdj, node.id, c.id);
        addToSetMap(g.undirectedAdj, c.id, node.id);
        g.parentCount.set(c.id, (g.parentCount.get(c.id) ?? 0) + 1);
        setRel(g.relLabel, node.id, c.id, (c as any).relation);
      }
      walk(c, node.id);
    }
  };

  for (const r of rows) walk(r);
  return g;
}

/** ===== chọn component lớn + root ===== */
function largestComponent(g: Graph): Set<string> {
  const elig = new Set<string>();
  for (const [u, ns] of g.undirectedAdj) {
    if (ns.size > 0) elig.add(u);
    ns.forEach((v) => elig.add(v));
  }
  if (!elig.size) return new Set<string>();
  const seen = new Set<string>();
  let best = new Set<string>();
  for (const s of elig) {
    if (seen.has(s)) continue;
    const comp = new Set<string>();
    const q = [s];
    seen.add(s);
    while (q.length) {
      const u = q.shift()!;
      comp.add(u);
      for (const v of g.undirectedAdj.get(u) ?? []) {
        if (!elig.has(v) || seen.has(v)) continue;
        seen.add(v);
        q.push(v);
      }
    }
    if (comp.size > best.size) best = comp;
  }
  return best;
}
const pickBestRoot = (g: Graph, comp: Set<string>): string | null => {
  const roots: string[] = [];
  for (const id of comp) {
    const indeg = g.parentCount.get(id) ?? 0;
    const hasChild = (g.childrenOf.get(id)?.size ?? 0) > 0;
    if (indeg === 0 && hasChild) roots.push(id);
  }
  if (!roots.length) {
    let best: string | null = null,
      mk = -1;
    for (const id of comp) {
      const k = g.childrenOf.get(id)?.size ?? 0;
      if (k > mk) {
        mk = k;
        best = id;
      }
    }
    return best;
  }
  const countDesc = (u: string, seen = new Set<string>()): number => {
    if (seen.has(u)) return 0;
    seen.add(u);
    let c = 1;
    for (const v of g.childrenOf.get(u) ?? []) c += countDesc(v, seen);
    return c;
  };
  let best: string | null = null,
    bestSz = -1;
  for (const r of roots) {
    const sz = countDesc(r);
    if (sz > bestSz) {
      bestSz = sz;
      best = r;
    }
  }
  return best;
};

/** ===== Suy giới tính & nhãn Vợ/Chồng cho CHÍNH người render ===== */
const isMale = (p?: Person | null) => {
  if (!p) return false;
  const g = (p.gender || "").toLowerCase();
  if (/^m(ale)?$|nam|chồng/.test(g)) return true;
  const n = (p.name || "").toLowerCase();
  return /(bố|ông|cụ)\b/.test(n);
};
const isFemale = (p?: Person | null) => {
  if (!p) return false;
  const g = (p.gender || "").toLowerCase();
  if (/^f(emale)?$|nữ|vợ/.test(g)) return true;
  const n = (p.name || "").toLowerCase();
  return /(mẹ|bà)\b/.test(n);
};
function ownMarriageRole(
  g: Graph,
  selfId: string,
  partnerId: string
): "Vợ" | "Chồng" | "" {
  const self = g.persons.get(selfId);
  if (isMale(self)) return "Chồng";
  if (isFemale(self)) return "Vợ";
  const relSelf = g.relLabel.get(selfId)?.get(partnerId) || "";
  if (/vợ/i.test(relSelf)) return "Chồng";
  if (/chồng/i.test(relSelf)) return "Vợ";
  const relPartner = g.relLabel.get(partnerId)?.get(selfId) || "";
  if (/vợ/i.test(relPartner)) return "Vợ";
  if (/chồng/i.test(relPartner)) return "Chồng";
  return "";
}

/** ===== Node mini ===== */
const NodeMini: React.FC<{
  person: Person;
  roleLabel?: "Vợ" | "Chồng" | "";
  selected?: boolean;
  onView?: () => void;
}> = ({ person, roleLabel = "", selected, onView }) => (
  <div className={`ft-node-card ${selected ? "ft-node-selected" : ""}`}>
    <div className="ft-node-avatar">
      {person.avatarUrl ? (
        <img
          className="ft-node-avatar-img"
          src={person.avatarUrl}
          alt={person.name}
        />
      ) : (
        <div className="ft-node-avatar-fallback">
          {(person.name?.[0] ?? "?").toUpperCase()}
        </div>
      )}
    </div>
    <div className="ft-node-name" title={person.name}>
      {person.name}
    </div>
    {roleLabel && <div className="ft-node-role">{roleLabel}</div>}
    <button className="ft-node-view" onClick={onView}>
      Xem
    </button>
  </div>
);

/** ===== ChildrenGroup (snap pixel để không lệch) ===== */
type ChildrenGroupProps = {
  childIds: string[];
  coupleEl: HTMLElement;
  anchorEl: HTMLElement;
  children: React.ReactNode;
  scale: number;
};
const ChildrenGroup = ({
  childIds,
  coupleEl,
  anchorEl,
  children,
  scale,
}: ChildrenGroupProps) => {
  const wrapRef = useRef<HTMLUListElement>(null);
  const hlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !coupleEl || !anchorEl) return;

    // reset
    coupleEl.style.marginLeft = "";
    coupleEl.style.width = "";
    coupleEl.style.transform = "";

    // stem
    let stem = coupleEl.querySelector<HTMLDivElement>(".ft-stem");
    if (!stem) {
      stem = document.createElement("div");
      stem.className = "ft-stem";
      coupleEl.appendChild(stem);
    }
    stem.style.display = "none";

    if (childIds.length === 0) return;

    const first = wrap.querySelector<HTMLElement>('li[data-child-index="0"]');
    const last = wrap.querySelector<HTMLElement>(
      `li[data-child-index="${childIds.length - 1}"]`
    );
    if (!first) return;

    const box = wrap.getBoundingClientRect();
    const cx = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return r.left - box.left + r.width / 2;
    };

    // Snap về pixel theo devicePixelRatio để tránh sub-pixel khi scale
    const snapPx = (v: number) => {
      const s = scale || 1;
      const px = v / s;
      const dpr = window.devicePixelRatio || 1;
      return `${Math.round(px * dpr) / dpr}px`;
    };

    if (childIds.length >= 2 && last && hlineRef.current) {
      const c1 = cx(first);
      const c2 = cx(last);
      const left = Math.min(c1, c2);
      const right = Math.max(c1, c2);

      hlineRef.current.style.left = snapPx(left);
      hlineRef.current.style.width = snapPx(right - left);

      coupleEl.style.marginLeft = snapPx(left);
      coupleEl.style.width = snapPx(right - left);

      const cr = coupleEl.getBoundingClientRect();
      const ar = anchorEl.getBoundingClientRect();
      const anchorCenterInCouple = ar.left - cr.left + ar.width / 2;
      stem.style.left = snapPx(anchorCenterInCouple);
      stem.style.display = "block";
    } else {
      const childCenter = cx(first);

      let cr = coupleEl.getBoundingClientRect();
      let ar = anchorEl.getBoundingClientRect();
      const anchorCenterInCouple = ar.left - cr.left + ar.width / 2;

      const neededMarginLeft = childCenter - anchorCenterInCouple;
      coupleEl.style.marginLeft = snapPx(neededMarginLeft);

      cr = coupleEl.getBoundingClientRect();
      ar = anchorEl.getBoundingClientRect();
      const newCenter = ar.left - cr.left + ar.width / 2;

      stem.style.left = snapPx(newCenter);
      stem.style.display = "block";
    }
  }, [childIds, coupleEl, anchorEl, scale]);

  if (childIds.length === 0) return null;

  return (
    <ul className="ft-children" ref={wrapRef} data-kids={childIds.length}>
      {childIds.length >= 2 && (
        <div className="ft-hline" ref={hlineRef} aria-hidden="true" />
      )}
      {React.Children.map(children, (child, i) => (
        <li data-child-index={i}>{child}</li>
      ))}
    </ul>
  );
};

/* sắp cặp: nam trái – nữ phải */
function orderCouple(g: Graph, mainId: string, spouses: string[]): string[] {
  if (!spouses.length) return [mainId];
  const arr = [mainId, ...spouses];
  const score = (id: string) =>
    isMale(g.persons.get(id)) ? -10 : isFemale(g.persons.get(id)) ? 10 : 0;
  return arr.sort((a, b) => score(a) - score(b));
}

/** ===== Node ===== */
const TreeNode: React.FC<{
  id: string;
  g: Graph;
  allowed: Set<string>;
  selectedId?: string | null;
  onView: (id: string) => void;
  scale: number;
}> = ({ id, g, allowed, selectedId, onView, scale }) => {
  const me = g.persons.get(id);
  if (!me) return null;

  const spouses = Array.from(g.spousesOf.get(id) ?? []).filter((x) =>
    allowed.has(x)
  );
  const ordered = orderCouple(g, id, spouses);

  // con của id: nếu có cả bố/mẹ thì ưu tiên nối về bố/nam
  const rawChildren = Array.from(g.childrenOf.get(id) ?? []);
  const childrenIds = rawChildren
    .filter((cid) => {
      const parents = Array.from(g.parentsOf.get(cid) ?? []);
      if (parents.length <= 1)
        return parents.length === 1 ? parents[0] === id : true;
      const fam = parents.filter((p) => p === id || spouses.includes(p));
      if (!fam.length) return parents.includes(id);
      const male = fam.find((p) => isMale(g.persons.get(p)!));
      const preferred = male ?? fam[0];
      return preferred === id;
    })
    .filter((x) => allowed.has(x));

  const hasChildren = childrenIds.length > 0;
  const coupleRef = useRef<HTMLDivElement>(null);
  const anchorPid =
    [id, ...spouses].find((pid) => isMale(g.persons.get(pid))) ?? id;

  return (
    <li data-node={id}>
      <div className="ft-couple" ref={coupleRef}>
        {/* người chính */}
        <div className="ft-person" data-pid={me.id}>
          <NodeMini
            person={me}
            roleLabel={
              spouses.length ? ownMarriageRole(g, me.id, spouses[0]) : ""
            }
            selected={selectedId === id}
            onView={() => onView(id)}
          />
        </div>

        {/* vợ/chồng */}
        {ordered.map((pid) =>
          pid !== id ? (
            <div key={pid} className="ft-person" data-pid={pid}>
              <NodeMini
                person={g.persons.get(pid)!}
                roleLabel={ownMarriageRole(g, pid, id)}
                selected={selectedId === pid}
                onView={() => onView(pid)}
              />
            </div>
          ) : null
        )}
      </div>

      {/* nhóm con */}
      {hasChildren && coupleRef.current && (
        <ChildrenGroup
          childIds={childrenIds}
          coupleEl={coupleRef.current}
          anchorEl={
            coupleRef.current.querySelector<HTMLElement>(
              `.ft-person[data-pid="${anchorPid}"]`
            )!
          }
          scale={scale}
        >
          {childrenIds.map((cid) => (
            <TreeNode
              key={cid}
              id={cid}
              g={g}
              allowed={allowed}
              selectedId={selectedId}
              onView={onView}
              scale={scale}
            />
          ))}
        </ChildrenGroup>
      )}
    </li>
  );
};

/** ===== Main ===== */
const FamilyTree: React.FC = () => {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [error, setError] = useState("");
  const [graph, setGraph] = useState<Graph | null>(null);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [treeRootId, setTreeRootId] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<UserDetail | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");
  const [scale, setScale] = useState(1);

  // refs cho layout/fit
  const containerRef = useRef<HTMLDivElement>(null); // .tree-wrap
  const canvasRef = useRef<HTMLDivElement>(null); // .ft-canvas
  const treeRootRef = useRef<HTMLUListElement>(null); // .ft-tree
  const [autoFit, setAutoFit] = useState(true);

  // pan
  const drag = useRef({ dragging: false, x: 0, y: 0 });
  const onMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    drag.current = { dragging: true, x: e.clientX, y: e.clientY };
    containerRef.current.style.cursor = "grabbing";
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !drag.current.dragging) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    containerRef.current.scrollLeft -= dx;
    containerRef.current.scrollTop -= dy;
  };
  const onMouseUpLeave = () => {
    if (!containerRef.current) return;
    drag.current.dragging = false;
    containerRef.current.style.cursor = "default";
  };

  const load = async () => {
    setStatus("loading");
    setError("");
    try {
      const data = await fetchFamilyTree();
      const g = buildGraphRecursive(data);
      const comp = largestComponent(g);
      if (comp.size === 0) {
        setGraph(g);
        setTreeRootId(null);
        setVisibleIds(new Set());
        setStatus("ready");
        return;
      }
      const start = pickBestRoot(g, comp) ?? Array.from(comp)[0];
      setGraph(g);
      setTreeRootId(start);
      setVisibleIds(new Set(comp));
      setSelectedId(start);
      setStatus("ready");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Không thể tải dữ liệu");
    }
  };
  useEffect(() => {
    void load();
  }, []);

  // căn giữa root
  useEffect(() => {
    if (status !== "ready" || !treeRootId) return;
    const wrap = containerRef.current;
    const el = wrap?.querySelector<HTMLElement>(`[data-node="${treeRootId}"]`);
    if (!wrap || !el) return;
    setTimeout(() => {
      const wr = wrap.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      wrap.scrollTo({
        left:
          wrap.scrollLeft + (er.left - wr.left) - wr.width / 2 + er.width / 2,
        top: wrap.scrollTop + (er.top - wr.top) - wr.height / 2 + er.height / 2,
        behavior: "auto",
      });
    }, 0);
  }, [status, treeRootId]);

  // ====== AUTO-FIT ======
  const getNaturalContentSize = () => {
    const tree = treeRootRef.current;
    if (!tree) return { w: 0, h: 0 };
    const r = tree.getBoundingClientRect();
    const s = scale || 1;
    return { w: r.width / s, h: r.height / s };
  };
  const doAutoFit = () => {
    const wrap = containerRef.current;
    if (!wrap) return;
    const pad = 40;
    const { w, h } = getNaturalContentSize();
    if (w === 0 || h === 0) return;
    const maxW = Math.max(1, wrap.clientWidth - pad);
    const maxH = Math.max(1, wrap.clientHeight - pad);
    const fit = Math.min(1, maxW / w, maxH / h);
    if (Math.abs(fit - scale) > 0.005) setScale(+fit.toFixed(2));
  };
  useEffect(() => {
    if (status !== "ready" || !treeRootId) return;
    const id = requestAnimationFrame(() => {
      if (autoFit) doAutoFit();
    });
    return () => cancelAnimationFrame(id);
  }, [status, treeRootId, autoFit]);
  useEffect(() => {
    const wrap = containerRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      if (autoFit) doAutoFit();
    });
    ro.observe(wrap);
    const onWin = () => {
      if (autoFit) doAutoFit();
    };
    window.addEventListener("resize", onWin);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWin);
    };
  }, [autoFit]);

  // search
  const suggestions = useMemo(() => {
    if (!graph || !search.trim()) return [];
    const q = search.toLowerCase();
    return Array.from(graph.persons.values())
      .filter((p) => visibleIds.has(p.id) && p.name?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [graph, visibleIds, search]);

  const centerNode = (id: string) => {
    setSelectedId(id);
    setTimeout(() => {
      const wrap = containerRef.current;
      const el = wrap?.querySelector<HTMLElement>(`[data-node="${id}"]`);
      if (!wrap || !el) return;
      const wr = wrap.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      wrap.scrollTo({
        left:
          wrap.scrollLeft + (er.left - wr.left) - wr.width / 2 + er.width / 2,
        top: wrap.scrollTop + (er.top - wr.top) - wr.height / 2 + er.height / 2,
        behavior: "smooth",
      });
    }, 0);
    setTimeout(() => {
      if (autoFit) doAutoFit();
    }, 50);
  };

  // ấn Xem mới gọi API
  const handleView = async (id: string) => {
    setSelectedId(id);
    const detail = await getUserById(id);
    setSelectedDetail(detail);
    setShowModal(true);
  };

  // dữ liệu quan hệ cho popup
  const relationForPopup = useMemo(() => {
    if (!graph || !selectedId)
      return {
        wives: [] as string[],
        husbands: [] as string[],
        children: [] as string[],
      };
    const spouses = Array.from(graph.spousesOf.get(selectedId) ?? []);
    const wives: string[] = [],
      husbands: string[] = [];
    for (const s of spouses) {
      const role = ownMarriageRole(graph, selectedId, s);
      if (role === "Vợ") wives.push(graph.persons.get(s)?.name || s);
      else if (role === "Chồng") husbands.push(graph.persons.get(s)?.name || s);
    }
    const children = Array.from(graph.childrenOf.get(selectedId) ?? []).map(
      (c) => graph.persons.get(c)?.name || c
    );
    return { wives, husbands, children };
  }, [graph, selectedId]);

  return (
    <div className="family-wrap">
      <div className="toolbar">
        <button className="retry-btn" onClick={() => void load()}>
          Tải lại cây
        </button>
      </div>

      {status === "loading" && <div className="loading">Đang tải dữ liệu…</div>}
      {status === "error" && <div className="error-box">Lỗi: {error}</div>}

      {status === "ready" && graph && treeRootId && visibleIds.size > 0 && (
        <>
          <div className="ft-toolbar">
            <div className="ft-search">
              <input
                className="ft-search-input"
                placeholder="Tìm theo họ tên…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {!!search && suggestions.length > 0 && (
                <div className="ft-suggest">
                  {suggestions.map((p) => (
                    <div
                      key={p.id}
                      className="ft-suggest-item"
                      onClick={() => {
                        centerNode(p.id);
                        setSearch(p.name);
                      }}
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ft-zoom">
              <button
                className="ft-zoom-btn"
                onClick={() => {
                  setAutoFit(false);
                  setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)));
                }}
              >
                −
              </button>
              <span className="ft-zoom-label">{Math.round(scale * 100)}%</span>
              <button
                className="ft-zoom-btn"
                onClick={() => {
                  setAutoFit(false);
                  setScale((s) => Math.min(2, +(s + 0.1).toFixed(2)));
                }}
              >
                +
              </button>
              <button
                className="ft-zoom-reset"
                onClick={() => {
                  setAutoFit(true);
                  setTimeout(doAutoFit, 0);
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <div
            className="tree-wrap"
            ref={containerRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUpLeave}
            onMouseLeave={onMouseUpLeave}
          >
            <div
              className="ft-canvas"
              ref={canvasRef}
              style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}
            >
              <ul className="ft-tree" ref={treeRootRef}>
                <TreeNode
                  id={treeRootId}
                  g={graph}
                  allowed={visibleIds}
                  selectedId={selectedId}
                  onView={handleView}
                  scale={scale}
                />
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Popup xem */}
      {graph && selectedId && (
        <div
          className={`ft-modal ${showModal ? "show" : ""}`}
          onClick={() => setShowModal(false)}
        >
          <div className="ft-modal-body" onClick={(e) => e.stopPropagation()}>
            <div className="ft-modal-title">
              {graph.persons.get(selectedId)?.name}
            </div>

            <div className="ft-modal-row">
              <span>Giới tính:</span>{" "}
              {selectedDetail?.gender ??
                graph.persons.get(selectedId)?.gender ??
                "—"}
            </div>
            {selectedDetail?.birthday && (
              <div className="ft-modal-row">
                <span>Ngày sinh:</span> {selectedDetail.birthday}
              </div>
            )}
            {selectedDetail?.death_day && (
              <div className="ft-modal-row">
                <span>Ngày mất:</span> {selectedDetail.death_day}
              </div>
            )}

            {(relationForPopup.wives.length > 0 ||
              relationForPopup.husbands.length > 0 ||
              relationForPopup.children.length > 0) && (
              <div className="ft-modal-row" style={{ display: "block" }}>
                <div style={{ marginBottom: 6, fontWeight: 600 }}>
                  Mối quan hệ:
                </div>
                {relationForPopup.husbands.length > 0 && (
                  <div>Chồng: {relationForPopup.husbands.join(", ")}</div>
                )}
                {relationForPopup.wives.length > 0 && (
                  <div>Vợ: {relationForPopup.wives.join(", ")}</div>
                )}
                {relationForPopup.children.length > 0 && (
                  <div>Con: {relationForPopup.children.join(", ")}</div>
                )}
              </div>
            )}

            {selectedDetail?.email && (
              <div className="ft-modal-row">
                <span>Email:</span> {selectedDetail.email}
              </div>
            )}
            {selectedDetail?.phone_number && (
              <div className="ft-modal-row">
                <span>Điện thoại:</span> {selectedDetail.phone_number}
              </div>
            )}
            {selectedDetail?.address && (
              <div className="ft-modal-row">
                <span>Địa chỉ:</span> {selectedDetail.address}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 12,
              }}
            >
              <button className="retry-btn" onClick={() => setShowModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyTree;
