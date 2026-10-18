"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { SAVED_LAYOUT, useDeskLayout, type Entry, type Layout } from "./editable";
import { EDITABLES, EDITABLE_IDS, PROP_FIELDS, type EditableId } from "./editable-ids";
import e from "./editor.module.css";

// Edit mode for the desk scene (development only; the page loads this module on demand).
// Click an object to select it, drag to move, use the corner handles to resize and the top handle
// to rotate. The inspector edits exact values and text; "Save layout" writes desk-layout.json.

const DRAFT_KEY = "diya-desk-layout-draft";
const HISTORY_LIMIT = 100;

type Point = { x: number; y: number };
type Drag =
  | { kind: "move"; id: EditableId; toLocal: DOMMatrix; start: DOMPoint; entry: Entry; before: Layout; moved: boolean }
  | { kind: "scale"; id: EditableId; center: Point; startDist: number; entry: Entry; before: Layout; moved: boolean }
  | { kind: "rotate"; id: EditableId; center: Point; startAngle: number; entry: Entry; before: Layout; moved: boolean };
type Box = { corners: Point[]; center: Point; rotateHandle: Point; topMid: Point; outside: boolean };

const round = (value: number, step: number) => Math.round(value / step) * step;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const tidy = (value: number) => Math.round(value * 1000) / 1000;

// Drops identity values so the saved file lists only what was actually changed.
export function cleanLayout(layout: Layout): Layout {
  const out: Layout = {};
  for (const id of EDITABLE_IDS) {
    const entry = layout[id];
    if (!entry) continue;
    const next: Entry = {};
    if (entry.dx) next.dx = tidy(entry.dx);
    if (entry.dy) next.dy = tidy(entry.dy);
    if (entry.scale !== undefined && entry.scale !== 1) next.scale = tidy(entry.scale);
    if (entry.rotate) next.rotate = tidy(entry.rotate);
    if ((next.scale !== undefined || next.rotate !== undefined) && entry.cx !== undefined && entry.cy !== undefined) {
      next.cx = tidy(entry.cx);
      next.cy = tidy(entry.cy);
    }
    if (entry.hidden) next.hidden = true;
    if (entry.deleted) next.deleted = true;
    if (entry.z !== undefined) next.z = entry.z;
    if (entry.props && Object.keys(entry.props).length) next.props = entry.props;
    if (Object.keys(next).length) out[id] = next;
  }
  return out;
}

const withEntry = (layout: Layout, id: EditableId, patch: Entry): Layout => ({ ...layout, [id]: { ...layout[id], ...patch } });

export default function DeskEditor({ svgRef }: { svgRef: RefObject<SVGSVGElement> }) {
  const { layout, setLayout, setEditing, selected, setSelected, registry, layers } = useDeskLayout();
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const past = useRef<Layout[]>([]);
  const future = useRef<Layout[]>([]);
  const drag = useRef<Drag | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState<Layout | null>(null);
  const [, setHistoryTick] = useState(0);

  const remember = useCallback((before: Layout) => {
    past.current.push(before);
    if (past.current.length > HISTORY_LIMIT) past.current.shift();
    future.current = [];
    setHistoryTick((tick) => tick + 1);
  }, []);

  const apply = useCallback((change: (current: Layout) => Layout) => {
    const before = layoutRef.current;
    const next = change(before);
    if (next === before) return;
    remember(before);
    setLayout(next);
  }, [remember, setLayout]);

  const undo = useCallback(() => {
    const previous = past.current.pop();
    if (!previous) return;
    future.current.push(layoutRef.current);
    setLayout(previous);
    setHistoryTick((tick) => tick + 1);
  }, [setLayout]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(layoutRef.current);
    setLayout(next);
    setHistoryTick((tick) => tick + 1);
  }, [setLayout]);

  // The centre that scale and rotation turn around: the middle of the object's own drawing.
  const withCentre = useCallback((id: EditableId, entry: Entry): Entry => {
    if (entry.cx !== undefined && entry.cy !== undefined) return entry;
    const inner = registry.get(id)?.inner;
    if (!inner) return entry;
    const bounds = inner.getBBox();
    return { ...entry, cx: tidy(bounds.x + bounds.width / 2), cy: tidy(bounds.y + bounds.height / 2) };
  }, [registry]);

  const patch = useCallback((id: EditableId, change: Entry, needsCentre = false) => {
    apply((current) => {
      const entry = needsCentre ? withCentre(id, current[id] ?? {}) : current[id] ?? {};
      return withEntry(current, id, { ...entry, ...change });
    });
  }, [apply, withCentre]);

  // Delete takes the object out of the room (Undo or Restore brings it back); Save makes it stick.
  const remove = useCallback((id: EditableId) => {
    patch(id, { deleted: true });
    setSelected(null);
    setStatus(`Deleted ${EDITABLES[id]}. Undo or Restore brings it back.`);
  }, [patch, setSelected]);

  const restore = useCallback((id: EditableId) => {
    apply((current) => {
      const entry = { ...current[id] };
      delete entry.deleted;
      return { ...current, [id]: entry };
    });
    setSelected(id);
    setStatus(`Restored ${EDITABLES[id]}`);
  }, [apply, setSelected]);

  /* ---------- Unsaved draft in this browser ---------- */

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as Layout;
      if (JSON.stringify(cleanLayout(stored)) !== JSON.stringify(cleanLayout(layoutRef.current))) setDraft(stored);
    } catch {
      // A missing or unreadable draft just means there is nothing to restore.
    }
  }, []);

  useEffect(() => {
    if (draft) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(cleanLayout(layout)));
    } catch {
      // The draft is a convenience; saving to the file is what keeps changes.
    }
  }, [layout, draft]);

  /* ---------- Selection box ---------- */

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = requestAnimationFrame(measure);
      const item = selected ? registry.get(selected) : undefined;
      const matrix = item?.inner.getScreenCTM();
      if (!item || !matrix || item.outer.getAttribute("display") === "none") {
        setBox((current) => (current ? null : current));
        return;
      }
      const b = item.inner.getBBox();
      const map = (x: number, y: number) => {
        const p = new DOMPoint(x, y).matrixTransform(matrix);
        return { x: p.x, y: p.y };
      };
      const corners = [map(b.x, b.y), map(b.x + b.width, b.y), map(b.x + b.width, b.y + b.height), map(b.x, b.y + b.height)];
      const center = map(b.x + b.width / 2, b.y + b.height / 2);
      const topMid = map(b.x + b.width / 2, b.y);
      const ux = topMid.x - center.x;
      const uy = topMid.y - center.y;
      const length = Math.hypot(ux, uy) || 1;
      const rotateHandle = { x: topMid.x + (ux / length) * 26, y: topMid.y + (uy / length) * 26 };
      // The room is drawn on a 1600 × 800 canvas; anything past its sides or top is cut off on smaller
      // screens (the desk below it is fine).
      const room = svgRef.current?.getScreenCTM();
      const toRoom = room?.inverse();
      const outside = Boolean(toRoom) && corners.some((corner) => {
        const q = new DOMPoint(corner.x, corner.y).matrixTransform(toRoom);
        return q.x < -4 || q.x > 1604 || q.y < -4;
      });
      setBox((current) => {
        const next = { corners, center, topMid, rotateHandle, outside };
        return current && JSON.stringify(current) === JSON.stringify(next) ? current : next;
      });
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [selected, registry, svgRef]);

  /* ---------- Pointer: select and drag in the room, resize and rotate on the handles ---------- */

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      let target = (event.target as Element).closest("[data-edit-id]") as SVGGElement | null;
      if (!target) {
        setSelected(null);
        return;
      }
      if (event.altKey) target = (target.parentElement?.closest("[data-edit-id]") as SVGGElement | null) ?? target;
      const id = target.dataset.editId as EditableId;
      const parentMatrix = (target.parentNode as SVGGraphicsElement).getScreenCTM();
      event.preventDefault();
      event.stopPropagation();
      setSelected(id);
      if (!parentMatrix) return;
      const toLocal = parentMatrix.inverse();
      drag.current = { kind: "move", id, toLocal, start: new DOMPoint(event.clientX, event.clientY).matrixTransform(toLocal), entry: layoutRef.current[id] ?? {}, before: layoutRef.current, moved: false };
      svg.setPointerCapture(event.pointerId);
    };
    svg.addEventListener("pointerdown", down, true);
    return () => svg.removeEventListener("pointerdown", down, true);
  }, [svgRef, setSelected]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const current = drag.current;
      if (!current) return;
      current.moved = true;
      if (current.kind === "move") {
        const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(current.toLocal);
        const dx = round((current.entry.dx ?? 0) + p.x - current.start.x, event.shiftKey ? 0.1 : 0.5);
        const dy = round((current.entry.dy ?? 0) + p.y - current.start.y, event.shiftKey ? 0.1 : 0.5);
        setLayout((layout) => withEntry(layout, current.id, { dx, dy }));
      } else if (current.kind === "scale") {
        const ratio = Math.hypot(event.clientX - current.center.x, event.clientY - current.center.y) / current.startDist;
        const factor = event.shiftKey ? 1 + (ratio - 1) * 0.25 : ratio;
        const scale = clamp(round((current.entry.scale ?? 1) * factor, event.shiftKey ? 0.001 : 0.01), 0.05, 10);
        setLayout((layout) => withEntry(layout, current.id, { ...current.entry, scale }));
      } else {
        const angle = Math.atan2(event.clientY - current.center.y, event.clientX - current.center.x);
        const turned = (current.entry.rotate ?? 0) + ((angle - current.startAngle) * 180) / Math.PI;
        const rotate = round(turned, event.shiftKey ? 5 : 1);
        setLayout((layout) => withEntry(layout, current.id, { ...current.entry, rotate: ((rotate + 540) % 360) - 180 }));
      }
    };
    const up = () => {
      const current = drag.current;
      drag.current = null;
      if (current?.moved) remember(current.before);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [remember, setLayout]);

  const startHandle = (kind: "scale" | "rotate") => (event: React.PointerEvent) => {
    if (!selected || !box) return;
    event.preventDefault();
    event.stopPropagation();
    const entry = withCentre(selected, layoutRef.current[selected] ?? {});
    const center = box.center;
    if (kind === "scale") {
      drag.current = { kind, id: selected, center, startDist: Math.max(4, Math.hypot(event.clientX - center.x, event.clientY - center.y)), entry, before: layoutRef.current, moved: false };
    } else {
      drag.current = { kind, id: selected, center, startAngle: Math.atan2(event.clientY - center.y, event.clientX - center.x), entry, before: layoutRef.current, moved: false };
    }
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
  };

  /* ---------- Keyboard ---------- */

  const reorder = useCallback((id: EditableId, step: number) => {
    const layer = registry.get(id)?.layer;
    const ids = layer ? [...(layers.get(layer) ?? [])] : [];
    const index = ids.indexOf(id);
    const swap = index + step;
    if (index < 0 || swap < 0 || swap >= ids.length) return;
    [ids[index], ids[swap]] = [ids[swap], ids[index]];
    apply((current) => ids.reduce((next, other, z) => withEntry(next, other, { z }), current));
  }, [apply, layers, registry]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        return;
      }
      if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (event.key === "Escape") {
        setSelected(null);
        return;
      }
      if (!selected || mod) return;
      const entry = layoutRef.current[selected] ?? {};
      const nudge = event.shiftKey ? 10 : 1;
      const moves: Record<string, Entry> = {
        ArrowLeft: { dx: (entry.dx ?? 0) - nudge },
        ArrowRight: { dx: (entry.dx ?? 0) + nudge },
        ArrowUp: { dy: (entry.dy ?? 0) - nudge },
        ArrowDown: { dy: (entry.dy ?? 0) + nudge },
      };
      const scaleStep = event.shiftKey ? 0.05 : 0.01;
      const turnStep = event.shiftKey ? 5 : 1;
      if (moves[event.key]) patch(selected, moves[event.key]);
      else if (event.key === "+" || event.key === "=") patch(selected, { scale: clamp(tidy((entry.scale ?? 1) + scaleStep), 0.05, 10) }, true);
      else if (event.key === "-" || event.key === "_") patch(selected, { scale: clamp(tidy((entry.scale ?? 1) - scaleStep), 0.05, 10) }, true);
      else if (event.key === "[" || event.key === "{") patch(selected, { rotate: (entry.rotate ?? 0) - turnStep }, true);
      else if (event.key === "]" || event.key === "}") patch(selected, { rotate: (entry.rotate ?? 0) + turnStep }, true);
      else if (event.key === "Delete" || event.key === "Backspace") remove(selected);
      else if (event.key.toLowerCase() === "h") patch(selected, { hidden: !entry.hidden });
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [patch, redo, remove, selected, setSelected, undo]);

  /* ---------- Save ---------- */

  const save = async () => {
    setStatus("Saving…");
    try {
      const response = await fetch("/api/desk-layout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cleanLayout(layoutRef.current)) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? `Save failed (${response.status})`);
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Nothing to clear.
      }
      setStatus("Saved to desk-layout.json");
      setSelected(null);
      setEditing(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(cleanLayout(layoutRef.current), null, 2));
      setStatus("Layout JSON copied");
    } catch {
      setStatus("Couldn't copy; the clipboard is blocked");
    }
  };

  /* ---------- Inspector ---------- */

  const entry = selected ? layout[selected] ?? {} : {};
  const rendered = selected ? registry.has(selected) : false;
  const fields = selected ? PROP_FIELDS[selected] ?? [] : [];
  const parentId = selected ? (registry.get(selected)?.outer.parentElement?.closest("[data-edit-id]") as SVGGElement | null)?.dataset.editId as EditableId | undefined : undefined;
  const options = [...EDITABLE_IDS].sort((a, b) => EDITABLES[a].localeCompare(EDITABLES[b]));
  const deleted = options.filter((id) => layout[id]?.deleted);
  const isDeleted = selected ? Boolean(entry.deleted) : false;

  const numberField = (label: string, value: number, step: number, onChange: (value: number) => void) => <label className={e.field}>
    <span>{label}</span>
    <input type="number" step={step} value={value} onChange={(event) => {
      const parsed = Number(event.target.value);
      if (Number.isFinite(parsed)) onChange(parsed);
    }} />
  </label>;

  return <>
    {box && <svg className={e.overlay} aria-hidden="true">
      <polygon points={box.corners.map((p) => `${p.x},${p.y}`).join(" ")} className={e.outline} />
      <line x1={box.topMid.x} y1={box.topMid.y} x2={box.rotateHandle.x} y2={box.rotateHandle.y} className={e.outline} />
      <text x={box.corners[0].x} y={box.corners[0].y - 8} className={e.tag}>{selected ? EDITABLES[selected] : ""}</text>
      {box.corners.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="7" className={e.handle} onPointerDown={startHandle("scale")} />)}
      <circle cx={box.rotateHandle.x} cy={box.rotateHandle.y} r="8" className={`${e.handle} ${e.rotate}`} onPointerDown={startHandle("rotate")} />
    </svg>}

    <aside className={e.panel} aria-label="Room editor" data-collapsed={collapsed || undefined}>
      <header className={e.head}>
        <strong>Edit room</strong>
        <button type="button" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed}>{collapsed ? "Show" : "Hide"}</button>
        <button type="button" onClick={() => { setSelected(null); setEditing(false); }}>Done</button>
      </header>

      {!collapsed && <div className={e.body}>
        {draft && <div className={e.draft}>
          <p>You have unsaved changes from last time.</p>
          <button type="button" onClick={() => { remember(layoutRef.current); setLayout(draft); setDraft(null); }}>Restore</button>
          <button type="button" onClick={() => { setDraft(null); try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* nothing to clear */ } }}>Discard</button>
        </div>}

        <label className={e.field}>
          <span>Object</span>
          <select value={selected ?? ""} onChange={(event) => setSelected((event.target.value || null) as EditableId | null)}>
            <option value="">Click something in the room…</option>
            {options.map((id) => <option key={id} value={id}>{EDITABLES[id]}{layout[id]?.deleted ? " (deleted)" : layout[id]?.hidden ? " (hidden)" : registry.has(id) ? "" : " (not shown now)"}</option>)}
          </select>
        </label>

        {selected && isDeleted && <div className={e.row}>
          <button type="button" className={e.primary} onClick={() => restore(selected)}>Restore {EDITABLES[selected]}</button>
        </div>}

        {selected && !isDeleted && <>
          <div className={e.grid}>
            {numberField("X", entry.dx ?? 0, 1, (dx) => patch(selected, { dx }))}
            {numberField("Y", entry.dy ?? 0, 1, (dy) => patch(selected, { dy }))}
            {numberField("Size", entry.scale ?? 1, 0.01, (scale) => patch(selected, { scale: clamp(scale, 0.05, 10) }, true))}
            {numberField("Turn °", entry.rotate ?? 0, 1, (rotate) => patch(selected, { rotate }, true))}
          </div>
          {box?.outside && <p className={e.warn}>Part of this is outside the room&apos;s drawing area, so smaller screens will cut it off.</p>}
          <div className={e.row}>
            <button type="button" onClick={() => reorder(selected, 1)} disabled={!rendered}>Forward</button>
            <button type="button" onClick={() => reorder(selected, -1)} disabled={!rendered}>Backward</button>
            <button type="button" onClick={() => parentId && setSelected(parentId)} disabled={!parentId}>Parent</button>
          </div>
          <div className={e.row}>
            <button type="button" onClick={() => patch(selected, { hidden: !entry.hidden })}>{entry.hidden ? "Show" : "Hide"}</button>
            <button type="button" className={e.danger} onClick={() => remove(selected)}>Delete</button>
            <button type="button" onClick={() => apply((current) => { const next = { ...current }; delete next[selected]; return next; })}>Reset this</button>
          </div>
          {fields.map((field) => <label key={field.key} className={e.field}>
            <span>{field.label}</span>
            <input type="text" value={entry.props?.[field.key] ?? ""} placeholder={field.kind === "image" ? "/concepts/desk/picture.webp" : "Original text"} onChange={(event) => {
              const props = { ...entry.props, [field.key]: event.target.value };
              if (!event.target.value) delete props[field.key];
              patch(selected, { props });
            }} />
          </label>)}
        </>}

        {deleted.length > 0 && <div className={e.deletedList}>
          <span>Deleted</span>
          <ul>
            {deleted.map((id) => <li key={id}>
              <span>{EDITABLES[id]}</span>
              <button type="button" onClick={() => restore(id)}>Restore</button>
            </li>)}
          </ul>
        </div>}

        <p className={e.help}>Drag to move. Corner dots resize, the top dot rotates (hold Shift for fine steps). Arrow keys nudge, + and − resize, [ and ] turn, Delete removes, H hides, Esc deselects, Alt-click picks the parent.</p>

        <div className={e.row}>
          <button type="button" onClick={undo} disabled={!past.current.length}>Undo</button>
          <button type="button" onClick={redo} disabled={!future.current.length}>Redo</button>
          <button type="button" onClick={() => apply(() => ({}))}>Reset all</button>
        </div>
        <div className={e.row}>
          <button type="button" onClick={copy}>Copy JSON</button>
          <button type="button" className={e.primary} onClick={save}>Save layout</button>
        </div>
        <p className={e.status} role="status">{status || (JSON.stringify(cleanLayout(layout)) === JSON.stringify(cleanLayout(SAVED_LAYOUT)) ? "No unsaved changes" : "Unsaved changes")}</p>
      </div>}
    </aside>
  </>;
}
