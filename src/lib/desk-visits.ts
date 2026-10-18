// Anonymous visit log for the desk: when someone came, from where, on what, and how long the page
// was actually on their screen. No names, no IP addresses, no cookies; the id is a random value
// the visitor's browser keeps for one tab session. Stored like the desk notes: Upstash Redis when
// configured, a git-ignored file in development, otherwise nowhere. Visits are kept for 90 days.
import { promises as fs } from "node:fs";
import path from "node:path";
import { redisFromEnv, type RedisCommand } from "./desk-redis";

export type DeskVisit = {
  id: string;
  startedAt: string;
  lastSeenAt: string;
  /** Milliseconds the page was visible on the visitor's screen. */
  activeMs: number;
  path: string;
  /** The referring site's host name, or "" when they came directly. */
  source: string;
  country: string;
  region: string;
  city: string;
  device: "mobile" | "tablet" | "desktop";
  browser: string;
  os: string;
};

export type VisitStore = {
  get(id: string): Promise<DeskVisit | null>;
  put(visit: DeskVisit): Promise<void>;
  /** Newest first. */
  list(): Promise<DeskVisit[]>;
  clear(): Promise<void>;
};

const KEEP_MS = 90 * 24 * 60 * 60 * 1000;
const LIST_LIMIT = 1000;
const VISITS_FILE = path.join(process.cwd(), "data", "desk-visits.json");

const recentOnly = (visits: DeskVisit[]) => {
  const since = Date.now() - KEEP_MS;
  return visits.filter((visit) => Date.parse(visit.startedAt) >= since);
};

// Visits update every few seconds, so writes to the local file are queued one at a time;
// otherwise two visits saving at once could overwrite each other.
let fileQueue: Promise<unknown> = Promise.resolve();
const queued = <T,>(task: () => Promise<T>) => {
  const run = fileQueue.then(task, task);
  fileQueue = run.catch(() => {});
  return run;
};

const fileStore: VisitStore = {
  async list() {
    try {
      const visits = JSON.parse(await fs.readFile(VISITS_FILE, "utf8")) as DeskVisit[];
      return recentOnly(visits).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  },
  async get(id) {
    return (await fileStore.list()).find((visit) => visit.id === id) ?? null;
  },
  put(visit) {
    return queued(async () => {
      const visits = (await fileStore.list()).filter((entry) => entry.id !== visit.id);
      await fs.mkdir(path.dirname(VISITS_FILE), { recursive: true });
      await fs.writeFile(VISITS_FILE, `${JSON.stringify([visit, ...visits].slice(0, LIST_LIMIT), null, 2)}\n`);
    });
  },
  clear() {
    return queued(() => fs.rm(VISITS_FILE, { force: true }));
  },
};

function redisStore(command: RedisCommand): VisitStore {
  const INDEX = "desk-visits";
  const key = (id: string) => `desk-visit:${id}`;
  return {
    async get(id) {
      const value = (await command(["GET", key(id)])) as string | null;
      return value ? (JSON.parse(value) as DeskVisit) : null;
    },
    async put(visit) {
      await command(["SET", key(visit.id), JSON.stringify(visit), "PX", String(KEEP_MS)]);
      await command(["ZADD", INDEX, String(Date.parse(visit.startedAt)), visit.id]);
      await command(["ZREMRANGEBYSCORE", INDEX, "-inf", String(Date.now() - KEEP_MS)]);
    },
    async list() {
      const ids = (await command(["ZREVRANGE", INDEX, "0", String(LIST_LIMIT - 1)])) as string[];
      if (!ids.length) return [];
      const values = (await command(["MGET", ...ids.map(key)])) as (string | null)[];
      return values.filter((value): value is string => Boolean(value)).map((value) => JSON.parse(value) as DeskVisit);
    },
    async clear() {
      const ids = (await command(["ZRANGE", INDEX, "0", "-1"])) as string[];
      if (ids.length) await command(["DEL", ...ids.map(key)]);
      await command(["DEL", INDEX]);
    },
  };
}

export function visitStore(): VisitStore | null {
  const command = redisFromEnv();
  if (command) return redisStore(command);
  if (process.env.NODE_ENV === "development") return fileStore;
  return null;
}

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|slack|curl|wget|python-requests|axios|node-fetch/i;

/** A coarse description of the visitor's device from the user-agent string. */
export function describeAgent(agent: string) {
  const device: DeskVisit["device"] = /ipad|tablet/i.test(agent) ? "tablet" : /mobi|iphone|android/i.test(agent) ? "mobile" : "desktop";
  const browser = /edg\//i.test(agent) ? "Edge" : /opr\/|opera/i.test(agent) ? "Opera" : /firefox|fxios/i.test(agent) ? "Firefox" : /chrome|crios/i.test(agent) ? "Chrome" : /safari/i.test(agent) ? "Safari" : "Other";
  const os = /iphone|ipad|ios/i.test(agent) ? "iOS" : /android/i.test(agent) ? "Android" : /mac os x|macintosh/i.test(agent) ? "macOS" : /windows/i.test(agent) ? "Windows" : /linux/i.test(agent) ? "Linux" : "Other";
  return { device, browser, os, bot: BOT.test(agent) };
}
