import { promises as fs } from "node:fs";
import path from "node:path";
import { EDITABLE_IDS, PROP_FIELDS, type EditableId } from "@/app/_desk/editable-ids";

// Saves the desk scene layout from edit mode. Development only: in any other environment the
// route does not exist as far as callers can tell. It writes one fixed file and nothing else.

export const dynamic = "force-dynamic";

const LAYOUT_FILE = path.join(process.cwd(), "src/app/_desk/desk-layout.json");
const KNOWN = new Set<string>(EDITABLE_IDS);

const notFound = () => new Response("Not found", { status: 404 });
const bad = (message: string) => Response.json({ error: message }, { status: 400 });

function number(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? Math.round(value * 1000) / 1000 : undefined;
}

function cleanEntry(id: EditableId, raw: unknown): Record<string, unknown> | string {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return `${id}: entry must be an object`;
  const input = raw as Record<string, unknown>;
  const allowed = new Set(["dx", "dy", "scale", "rotate", "cx", "cy", "hidden", "deleted", "z", "props"]);
  for (const key of Object.keys(input)) if (!allowed.has(key)) return `${id}: unknown field ${key}`;

  const entry: Record<string, unknown> = {};
  const ranges: Record<string, [number, number]> = { dx: [-4000, 4000], dy: [-4000, 4000], scale: [0.05, 10], rotate: [-720, 720], cx: [-5000, 5000], cy: [-5000, 5000], z: [0, 999] };
  for (const [key, [min, max]] of Object.entries(ranges)) {
    if (input[key] === undefined) continue;
    const value = number(input[key], min, max);
    if (value === undefined) return `${id}: ${key} must be a number from ${min} to ${max}`;
    entry[key] = key === "z" ? Math.round(value) : value;
  }
  if (input.hidden !== undefined) {
    if (typeof input.hidden !== "boolean") return `${id}: hidden must be true or false`;
    if (input.hidden) entry.hidden = true;
  }
  if (input.deleted !== undefined) {
    if (typeof input.deleted !== "boolean") return `${id}: deleted must be true or false`;
    if (input.deleted) entry.deleted = true;
  }
  if (input.props !== undefined) {
    if (typeof input.props !== "object" || input.props === null || Array.isArray(input.props)) return `${id}: props must be an object`;
    const fields = new Map((PROP_FIELDS[id] ?? []).map((field) => [field.key, field.kind]));
    const props: Record<string, string> = {};
    for (const [key, value] of Object.entries(input.props as Record<string, unknown>)) {
      const kind = fields.get(key);
      if (!kind) return `${id}: unknown text field ${key}`;
      if (typeof value !== "string" || value.length > 300) return `${id}: ${key} must be text up to 300 characters`;
      if (kind === "image" && !/^\/[\w\-./]+\.(webp|png|jpe?g|gif|svg|avif)$/i.test(value)) return `${id}: ${key} must be an image path such as /concepts/desk/picture.webp`;
      if (kind === "image" && value.includes("..")) return `${id}: ${key} must not contain ".."`;
      props[key] = value;
    }
    if (Object.keys(props).length) entry.props = props;
  }
  return entry;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return notFound();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("Body must be JSON");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return bad("Layout must be an object");

  const layout: Record<string, unknown> = {};
  for (const [id, raw] of Object.entries(body as Record<string, unknown>)) {
    // Objects removed from the room can linger in an open editor or a saved draft; drop them.
    if (!KNOWN.has(id)) continue;
    const entry = cleanEntry(id as EditableId, raw);
    if (typeof entry === "string") return bad(entry);
    if (Object.keys(entry).length) layout[id] = entry;
  }

  await fs.writeFile(LAYOUT_FILE, `${JSON.stringify(layout, null, 2)}\n`, "utf8");
  return Response.json({ ok: true, objects: Object.keys(layout).length });
}

export function GET() {
  return notFound();
}
