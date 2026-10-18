"use client";

import { Children, createContext, isValidElement, useContext, useLayoutEffect, useMemo, useRef, useState, type Dispatch, type ReactElement, type ReactNode, type SetStateAction } from "react";
import savedLayout from "./desk-layout.json";
import { EDITABLES, type EditableId } from "./editable-ids";

// The desk scene's layout: each object's offset, scale, rotation, visibility, stacking order and
// editable text/images. The saved layout ships with the page; edit mode (development only) changes
// it live and writes it back to desk-layout.json.

export type EntryProps = Record<string, string>;
// `hidden` is a temporary toggle while arranging; `deleted` removes the object from the room.
export type Entry = { dx?: number; dy?: number; scale?: number; rotate?: number; cx?: number; cy?: number; hidden?: boolean; deleted?: boolean; z?: number; props?: EntryProps };
export type Layout = Partial<Record<EditableId, Entry>>;

export const SAVED_LAYOUT = savedLayout as Layout;

export type Registered = { id: EditableId; outer: SVGGElement; inner: SVGGElement; layer: string };

type DeskLayout = {
  layout: Layout;
  setLayout: Dispatch<SetStateAction<Layout>>;
  editing: boolean;
  setEditing: Dispatch<SetStateAction<boolean>>;
  selected: EditableId | null;
  setSelected: Dispatch<SetStateAction<EditableId | null>>;
  registry: Map<EditableId, Registered>;
  layers: Map<string, EditableId[]>;
};

const LayoutContext = createContext<DeskLayout | null>(null);
const LayerContext = createContext("room");

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<Layout>(SAVED_LAYOUT);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<EditableId | null>(null);
  const registry = useRef(new Map<EditableId, Registered>()).current;
  const layers = useRef(new Map<string, EditableId[]>()).current;
  const value = useMemo(() => ({ layout, setLayout, editing, setEditing, selected, setSelected, registry, layers }), [layout, editing, selected, registry, layers]);
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

// Outside a provider (for example while a parent is still being wired up) objects simply use the
// saved layout and can't be edited, rather than breaking the page.
const STATIC_LAYOUT: DeskLayout = {
  layout: SAVED_LAYOUT,
  setLayout: () => undefined,
  editing: false,
  setEditing: () => undefined,
  selected: null,
  setSelected: () => undefined,
  registry: new Map(),
  layers: new Map(),
};

export function useDeskLayout() {
  return useContext(LayoutContext) ?? STATIC_LAYOUT;
}

// Text and image overrides for one object, falling back to the drawing's own defaults.
export function useEditableProps<T extends EntryProps>(id: EditableId, defaults: T): T {
  const { layout } = useDeskLayout();
  const props = layout[id]?.props;
  return props ? { ...defaults, ...props } : defaults;
}

export function transformOf(entry: Entry | undefined) {
  if (!entry) return undefined;
  const { dx = 0, dy = 0, scale = 1, rotate = 0, cx = 0, cy = 0 } = entry;
  const parts: string[] = [];
  if (dx || dy) parts.push(`translate(${dx} ${dy})`);
  if (scale !== 1 || rotate) parts.push(`translate(${cx} ${cy})`, rotate ? `rotate(${rotate})` : "", scale !== 1 ? `scale(${scale})` : "", `translate(${-cx} ${-cy})`);
  return parts.filter(Boolean).join(" ") || undefined;
}

// Children with an `id` prop are drawn in their saved stacking order (z); others keep their place.
export function Layer({ name, children }: { name: string; children: ReactNode }) {
  const { layout, layers } = useDeskLayout();
  const items = Children.toArray(children).map((child, index) => {
    const id = isValidElement(child) ? (child as ReactElement<{ id?: EditableId }>).props.id : undefined;
    return { child, id, order: id && layout[id]?.z !== undefined ? layout[id]!.z! : index };
  });
  items.sort((a, b) => a.order - b.order);
  const ids = items.flatMap((item) => (item.id ? [item.id] : []));
  layers.set(name, ids);
  return <LayerContext.Provider value={name}>{items.map((item) => item.child)}</LayerContext.Provider>;
}

export function Editable({ id, children, className }: { id: EditableId; children: ReactNode; className?: string }) {
  const { layout, registry } = useDeskLayout();
  const layer = useContext(LayerContext);
  const outer = useRef<SVGGElement>(null);
  const inner = useRef<SVGGElement>(null);
  const entry = layout[id];

  useLayoutEffect(() => {
    if (!outer.current || !inner.current) return;
    registry.set(id, { id, outer: outer.current, inner: inner.current, layer });
    return () => { registry.delete(id); };
  }, [id, layer, registry]);

  if (entry?.deleted) return null;
  return <g ref={outer} data-edit-id={id} data-edit-label={EDITABLES[id]} className={className} transform={transformOf(entry)} display={entry?.hidden ? "none" : undefined}>
    <g ref={inner}>{children}</g>
  </g>;
}
