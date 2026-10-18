import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { noteStore } from "@/lib/desk-notes";

// Takes a note left at the desk and files it in Diya's desk diary. Nothing is sent by email and
// nothing a visitor writes is ever sent back to them.
export const dynamic = "force-dynamic";

const MAX_MESSAGE = 280;
const MAX_FROM = 60;
const MAX_BODY = 4096;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;

// Per-IP send times. In-memory, so it resets with the server; enough to stop a burst.
const recent = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const times = (recent.get(ip) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  const over = times.length >= RATE_LIMIT;
  if (!over) times.push(now);
  if (recent.size > 5000) recent.clear();
  recent.set(ip, times);
  return over;
}

// Trimmed plain text with control characters (other than line breaks) removed, or null if too long.
function clean(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  return text.length <= max ? text : null;
}

const answer = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status });

export async function POST(request: Request) {
  const store = noteStore();
  if (!store) return answer(503, { error: "closed" });

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return answer(413, { error: "too-large" });
  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return answer(400, { error: "invalid" });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return answer(400, { error: "invalid" });
  const input = body as Record<string, unknown>;

  // The hidden "website" field is only ever filled in by bots: pretend it worked and drop the note.
  if (typeof input.website === "string" && input.website !== "") return answer(201, { ok: true });

  const message = clean(input.message, MAX_MESSAGE);
  const from = input.from === undefined || input.from === "" ? "" : clean(input.from, MAX_FROM);
  if (!message || from === null) return answer(400, { error: "invalid" });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  if (limited(ip)) return answer(429, { error: "busy" });

  try {
    await store.add({ id: randomUUID(), message, from, at: new Date().toISOString() });
  } catch {
    return answer(500, { error: "failed" });
  }
  return answer(201, { ok: true });
}
