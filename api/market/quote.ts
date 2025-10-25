// Vercel/Netlify/Cloudflare-friendly serverless function
// GET /api/market/quote?symbol=AAPL
export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url ?? `https://x/?${req.query ?? ""}`);
    const symbol = (url.searchParams.get("symbol") || "AAPL").toUpperCase();

    const base = process.env.MARKET_API || "";
    const key  = process.env.MARKET_API_KEY || "";

    if (base && key) {
      // Example: TwelveData style
      const u = `${base}/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=2&apikey=${key}`;
      const r = await fetch(u);
      if (!r.ok) throw new Error("provider error");
      const j = await r.json();
      const last = j?.values?.[0];
      const prev = j?.values?.[1];
      if (!last) throw new Error("no data");
      const price = parseFloat(last.close);
      const prevClose = prev ? parseFloat(prev.close) : price;
      return res.status(200).json({ symbol, price, prevClose, ts: Date.now(), provider: "live" });
    }

    // Fallback: deterministic GBM around 100
    const seed = [...symbol].reduce((a,c)=>a+c.charCodeAt(0), 0);
    const z = Math.sin(seed + Math.floor(Date.now()/60000)) * 0.5; // minute bucket
    const price = +(100 * Math.exp(0.0002 + 0.01*z)).toFixed(2);
    return res.status(200).json({ symbol, price, prevClose: 100, ts: Date.now(), provider: "demo" });
  } catch (e:any) {
    return res.status(200).json({ symbol: "N/A", price: 100, prevClose: 100, ts: Date.now(), provider: "error", error: e?.message });
  }
}
