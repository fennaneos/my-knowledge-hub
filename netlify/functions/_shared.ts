// netlify/functions/_shared.ts
import type { HandlerEvent } from "@netlify/functions";

/** -------- API keys --------
 * Set env var API_KEYS as a comma-separated list (e.g., "key1,key2").
 * If unset, endpoints run in "public" mode but with stricter rate limits.
 */
const KEYS = (process.env.API_KEYS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function hasApiKeysConfigured() {
  return KEYS.length > 0;
}

export function isAuthorized(event: HandlerEvent): boolean {
  if (!hasApiKeysConfigured()) return true; // public if no keys configured
  const key =
    event.queryStringParameters?.api_key ||
    event.headers["x-api-key"] ||
    event.headers["authorization"]?.replace(/^Bearer\s+/i, "");
  return !!key && KEYS.includes(String(key));
}

/** -------- IP helpers -------- */
export function getClientIp(event: HandlerEvent): string {
  const h = event.headers || {};
  const xff = h["x-forwarded-for"] || h["x-real-ip"];
  if (xff) return String(xff).split(",")[0].trim();
  // Netlify specific:
  return (h["client-ip"] as string) || (h["x-nf-client-connection-ip"] as string) || "unknown";
}

/** -------- In-memory cache (per Lambda instance) -------- */
type CacheEntry<T> = { value: T; exp: number };
const mem = new Map<string, CacheEntry<any>>();

export function cacheGet<T>(key: string): T | undefined {
  const now = Date.now();
  const hit = mem.get(key);
  if (!hit) return;
  if (hit.exp < now) {
    mem.delete(key);
    return;
  }
  return hit.value as T;
}
export function cacheSet<T>(key: string, value: T, ttlMs: number) {
  mem.set(key, { value, exp: Date.now() + ttlMs });
}

/** -------- Basic rate limit (per IP + route) --------
 * token bucket-ish: allow N per window, else 429
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || now > cur.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (cur.count < limit) {
    cur.count += 1;
    return { ok: true };
  }
  return { ok: false, retryAfter: Math.max(0, Math.ceil((cur.resetAt - now) / 1000)) };
}

/** -------- Helpers -------- */
export function json(body: unknown, status = 200, cacheSecs = 0, extraHeaders?: Record<string, string>) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      ...(cacheSecs > 0
        ? {
            // client + CDN caching
            "Cache-Control": `public, max-age=${cacheSecs}, s-maxage=${cacheSecs}`,
          }
        : { "Cache-Control": "no-store" }),
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

export async function safeJson<T = any>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    const txt = await res.text();
    try {
      return JSON.parse(txt) as T;
    } catch {
      throw new Error(`Upstream returned non-JSON: ${txt.slice(0, 120)}`);
    }
  }
}

/** Normalize US tickers for Stooq (adds .us if no suffix) */
export function stooqSymbol(sym: string) {
  const s = sym.trim().toLowerCase();
  return s.includes(".") ? s : `${s}.us`;
}
