// netlify/functions/ohlc.ts
import type { Handler } from "@netlify/functions";
import { cacheGet, cacheSet, getClientIp, isAuthorized, hasApiKeysConfigured, json, rateLimit, stooqSymbol } from "./_shared";

/**
 * GET /.netlify/functions/ohlc?symbol=AAPL&limit=60
 * Returns [{date, open, high, low, close, volume}]
 */
export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") return json({ error: "Method not allowed" }, 405);

    const symbolRaw = (event.queryStringParameters?.symbol || "AAPL").toUpperCase();
    const limit = Math.min(Math.max(parseInt(event.queryStringParameters?.limit || "60", 10) || 60, 5), 1000);

    const authed = isAuthorized(event);
    const ip = getClientIp(event);
    const limitPerMin = authed ? 180 : 40;
    const rl = rateLimit(`ohlc:${ip}`, limitPerMin, 60_000);
    if (!rl.ok) return json({ error: "Too many requests", retryAfter: rl.retryAfter }, 429, 0);

    if (hasApiKeysConfigured() && !authed) {
      return json({ error: "Unauthorized: provide API key" }, 401);
    }

    const cacheKey = `ohlc:${symbolRaw}:${limit}`;
    const hit = cacheGet<any>(cacheKey);
    if (hit) return json(hit, 200, 60);

    const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol(symbolRaw))}&i=d`;
    const res = await fetch(url);
    const csv = await res.text();
    const lines = csv.trim().split("\n");
    // header: Date,Open,High,Low,Close,Volume
    const out = lines
      .slice(1)
      .map((ln) => ln.split(","))
      .filter((arr) => arr.length >= 6)
      .map(([date, open, high, low, close, volume]) => ({
        date,
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(volume),
      }))
      .filter((r) => Number.isFinite(r.close))
      .slice(-limit);

    cacheSet(cacheKey, out, 60_000); // 60s
    return json(out, 200, 60);
  } catch (err: any) {
    return json({ error: err?.message || "Unexpected error" }, 500, 5);
  }
};
