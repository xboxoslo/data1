import type { Env } from "./env";

export async function readJson<T>(env: Env, key: string): Promise<T | null> {
  const obj = await env.DATA.get(key);
  if (!obj) return null;
  return (await obj.json()) as T;
}

export async function writeJson(env: Env, key: string, value: unknown): Promise<void> {
  const body = JSON.stringify(value, null, 2) + "\n";
  await env.DATA.put(key, body, {
    httpMetadata: {
      contentType: "application/json; charset=utf-8",
      cacheControl: "no-cache, no-store, must-revalidate",
    },
  });
}

export function utcIsoNow(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, "Z");
}
