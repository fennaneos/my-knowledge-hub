import type { VercelRequest, VercelResponse } from "@vercel/node";
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const symbol = String(req.query.symbol || "");
    if (!symbol) return res.status(400).json({ error: "symbol required" });
    const r = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,
                          { headers: { "User-Agent": "Mozilla/5.0" }});
    const j = await r.json();
    const q = j?.quoteResponse?.result?.[0];
    if (!q) return res.status(404).json({ error: "no quote" });
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.json({ price: Number(q.regularMarketPrice ?? q.bid ?? q.ask ?? q.previousClose ?? null),
               dividendYield: Number(q.trailingAnnualDividendYield ?? 0) });
  } catch (e:any) { res.status(500).json({ error: String(e?.message || e) }); }
}
