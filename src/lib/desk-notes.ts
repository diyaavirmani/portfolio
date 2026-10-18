// Diya's desk diary: where notes left at the desk are kept.
//
// - With an Upstash Redis database configured (Vercel KV uses the same REST API and env vars),
//   notes go there.
// - Otherwise, in development, notes go to data/desk-notes.json, which git ignores.
// - Otherwise (production with nothing configured) there is no store and notes are closed.
import { promises as fs } from "node:fs";
import path from "node:path";
import { redisFromEnv, type RedisCommand } from "./desk-redis";

export type DeskNote = { id: string; message: string; from: string; at: string };

export type NoteStore = {
  add(note: DeskNote): Promise<void>;
  /** Newest first. */
  list(): Promise<DeskNote[]>;
  remove(id: string): Promise<void>;
};

const NOTES_FILE = path.join(process.cwd(), "data", "desk-notes.json");
const REDIS_KEY = "desk-notes";
const LIST_LIMIT = 500;

const fileStore: NoteStore = {
  async list() {
    try {
      return JSON.parse(await fs.readFile(NOTES_FILE, "utf8")) as DeskNote[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  },
  async add(note) {
    const notes = await fileStore.list();
    await fs.mkdir(path.dirname(NOTES_FILE), { recursive: true });
    await fs.writeFile(NOTES_FILE, `${JSON.stringify([note, ...notes], null, 2)}\n`);
  },
  async remove(id) {
    const notes = await fileStore.list();
    await fs.writeFile(NOTES_FILE, `${JSON.stringify(notes.filter((note) => note.id !== id), null, 2)}\n`);
  },
};

function redisStore(command: RedisCommand): NoteStore {
  const raw = async () => (await command(["LRANGE", REDIS_KEY, "0", String(LIST_LIMIT - 1)])) as string[];
  return {
    async add(note) {
      await command(["LPUSH", REDIS_KEY, JSON.stringify(note)]);
    },
    async list() {
      return (await raw()).map((item) => JSON.parse(item) as DeskNote);
    },
    async remove(id) {
      const item = (await raw()).find((entry) => (JSON.parse(entry) as DeskNote).id === id);
      if (item) await command(["LREM", REDIS_KEY, "1", item]);
    },
  };
}

export function noteStore(): NoteStore | null {
  const command = redisFromEnv();
  if (command) return redisStore(command);
  if (process.env.NODE_ENV === "development") return fileStore;
  return null;
}
