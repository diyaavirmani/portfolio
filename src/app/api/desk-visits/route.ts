import { NextResponse } from "next/server";
import { describeAgent, visitStore, type DeskVisit } from "@/lib/desk-visits";

// Records anonymous visits to the desk (see src/lib/desk-visits.ts). The visitor's browser sends a
// "start" when the page opens, a "beat" every so often while it's on screen, and an "end" when it's
// hidden or closed. The IP address is used only for the in-memory rate limit and is never stored.
export const dynamic = "force-dynamic";

const MAX_BODY = 2048;
const MAX_ACTIVE_MS = 12 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 120;
const EVENTS = new Set(["start", "beat", "end"]);

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

const header = (request: Request, name: string) => {
  const value = request.headers.get(name) ?? "";
  try {
    return decodeURIComponent(value).slice(0, 80);
  } catch {
    return value.slice(0, 80);
  }
};

// The referring site's host, or "" for direct visits and links from within the site itself.
function sourceOf(referrer: unknown, request: Request) {
  if (typeof referrer !== "string" || !referrer || referrer.length > 500) return "";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    const own = (request.headers.get("host") ?? "").split(":")[0].replace(/^www\./, "");
    return host === own || host === "localhost" || host === "127.0.0.1" ? "" : host.slice(0, 120);
  } catch {
    return "";
  }
}

const empty = (status: number) => new NextResponse(null, { status });

export async function POST(request: Request) {
  const store = visitStore();
  // No storage configured: visits simply aren't counted. Answer quietly so visitors' consoles stay clean.
  if (!store) return empty(204);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return empty(413);

  let input: Record<string, unknown>;
  try {
    const body = JSON.parse(await request.text());
    if (typeof body !== "object" || body === null || Array.isArray(body)) return empty(400);
    input = body as Record<string, unknown>;
  } catch {
    return empty(400);
  }

  const { id, event, path, activeMs } = input;
  if (typeof id !== "string" || !/^[a-z0-9-]{8,64}$/i.test(id)) return empty(400);
  if (typeof event !== "string" || !EVENTS.has(event)) return empty(400);
  const page = typeof path === "string" && path.startsWith("/") ? path.slice(0, 200) : "/";
  const active = typeof activeMs === "number" && Number.isFinite(activeMs) ? Math.min(Math.max(0, Math.round(activeMs)), MAX_ACTIVE_MS) : 0;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  if (limited(ip)) return empty(429);

  // Crawlers and link previews aren't visitors.
  const agent = describeAgent(request.headers.get("user-agent") ?? "");
  if (agent.bot) return empty(204);

  const now = new Date().toISOString();
  try {
    const existing = await store.get(id);
    const visit: DeskVisit = existing
      ? { ...existing, lastSeenAt: now, activeMs: Math.max(existing.activeMs, active) }
      : {
          id,
          startedAt: now,
          lastSeenAt: now,
          activeMs: active,
          path: page,
          source: sourceOf(input.referrer, request),
          country: header(request, "x-vercel-ip-country"),
          region: header(request, "x-vercel-ip-country-region"),
          city: header(request, "x-vercel-ip-city"),
          device: agent.device,
          browser: agent.browser,
          os: agent.os,
        };
    await store.put(visit);
  } catch {
    return empty(500);
  }
  return empty(204);
}
