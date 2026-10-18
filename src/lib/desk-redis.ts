// Upstash Redis over its REST API (Vercel KV uses the same API and env vars). No SDK is needed:
// each command is a JSON array, e.g. ["LPUSH", "key", "value"].
export type RedisCommand = (args: string[]) => Promise<unknown>;

export function redisFromEnv(): RedisCommand | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return async (args) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Redis answered ${response.status}`);
    return ((await response.json()) as { result: unknown }).result;
  };
}
