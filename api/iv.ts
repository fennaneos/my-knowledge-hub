// Vercel serverless function: /api/iv?symbol=AAPL
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const symbol = String(req.query.symbol || "").trim();
    if (!symbol) return res.status(400).json({ error: "symbol required" });

    const url = `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(symbol)}`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) throw new Error(`options fetch failed ${r.status}`);
    const j = await r.json();

    const chain = j?.optionChain?.result?.[0];
    const opts = chain?.options?.[0];
    if (!opts) return res.status(404).json({ error: "no options chain" });

    const last = Number(chain?.quote?.regularMarketPrice ?? 0);
    const calls = (opts.calls || []).filter((c: any) => Number.isFinite(c?.impliedVolatility));
    if (!calls.length) return res.status(404).json({ error: "no calls with IV" });

    // Choose call with strike closest to last price
    let best = calls[0];
    let bestD = Math.abs(Number(best.strike) - last);
    for (const c of calls) {
      const d = Math.abs(Number(c.strike) - last);
      if (d < bestD) { best = c; bestD = d; }
    }

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.json({ atmIV: Number(best.impliedVolatility) }); // fraction, e.g., 0.24
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
