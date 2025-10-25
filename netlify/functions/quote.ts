import type { Handler } from "@netlify/functions";

/**
 * Serverless function: robust market data fetch
 * - Price from Stooq (fallback-safe, automatic suffix for US tickers)
 * - Dividend yield (default 0.005)
 * - Optional IV (Yahoo)
 */
export const handler: Handler = async (event) => {
  const symbolRaw = (event.queryStringParameters?.symbol || "AAPL").trim().toUpperCase();

  try {
    // --- Normalize symbol for Stooq
    let stooqSymbol = symbolRaw.toLowerCase();
    if (!stooqSymbol.includes(".")) {
      // add .us suffix for plain tickers
      stooqSymbol += ".us";
    }

    // --- Fetch price from Stooq
    const stooqUrl = `https://stooq.com/q/l/?s=${stooqSymbol}&f=sd2t2ohlcvn&h&e=csv`;
    const stooqRes = await fetch(stooqUrl);
    const text = await stooqRes.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) throw new Error("Stooq: no data row");

    const parts = lines[1].split(",");
    const close = parseFloat(parts[6]);
    if (!Number.isFinite(close) || close <= 0) throw new Error("Stooq: invalid price");

    // --- Fallback dividend
    const dividendYield = 0.005;

    // --- Try Yahoo for IV
    let iv: number | undefined;
    try {
      const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" };
      const optRes = await fetch(
        `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(symbolRaw)}`,
        { headers }
      );
      if (optRes.ok) {
        const j = await optRes.json();
        const chain = j?.optionChain?.result?.[0];
        const last = Number(chain?.quote?.regularMarketPrice ?? close);
        const calls = chain?.options?.[0]?.calls ?? [];
        if (Array.isArray(calls) && calls.length) {
          let best = calls[0];
          let bestDist = Math.abs(Number(calls[0].strike) - last);
          for (const c of calls) {
            const dist = Math.abs(Number(c.strike) - last);
            if (dist < bestDist && Number.isFinite(c.impliedVolatility)) {
              best = c; bestDist = dist;
            }
          }
          const foundIv = Number(best?.impliedVolatility);
          if (Number.isFinite(foundIv) && foundIv > 0) iv = foundIv;
        }
      }
    } catch {
      // ignore — Yahoo sometimes blocks
    }

return {
  statusCode: 200,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // add this line
  },
  body: JSON.stringify({ price: close, dividendYield, ...(iv ? { iv } : {}) }),
};

  } catch (err: any) {
    console.error("Quote fetch error:", err.message);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || "Unknown error" }),
    };
  }
};
