// netlify/functions/market.ts
import type { Handler } from "@netlify/functions";

/**
 * Unified Market API (free sources: Stooq + Yahoo best-effort)
 *
 * GET /.netlify/functions/market?action=all&symbol=AAPL&days=180
 *  actions: all | quote | ohlc | options | stats
 *
 * Notes:
 * - Stooq daily OHLC: reliable, no key, CSV.
 * - Yahoo quote/options: richer fields; sometimes blocks → wrapped in try/catch.
 * - In-memory cache per function instance (helps with soft rate limits).
 */

type OHLC = { date: string; open: number; high: number; low: number; close: number; volume: number };
type Quote = { symbol: string; price: number; change?: number; changePct?: number; currency?: string; time?: string };
type Stats = {
  name?: string; exchange?: string; currency?: string;
  marketCap?: number; trailingPE?: number; forwardPE?: number;
  dividendYield?: number; dividendRate?: number;
  fiftyTwoWeekHigh?: number; fiftyTwoWeekLow?: number;
};
type OptionRow = { contractSymbol: string; strike: number; lastPrice?: number; bid?: number; ask?: number; volume?: number; openInterest?: number; impliedVolatility?: number };
type Options = { asOf?: string; underlying?: string; expiration?: string; ivAtm?: number; calls?: OptionRow[]; puts?: OptionRow[] };

const CACHE = new Map<string, { exp: number; data: any }>();
const sec = (n: number) => n * 1000;

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

function getCache<T>(key: string): T | undefined {
  const hit = CACHE.get(key);
  if (hit && hit.exp > Date.now()) return hit.data as T;
  return undefined;
}
function setCache(key: string, data: any, ttlMs = sec(30)) {
  CACHE.set(key, { exp: Date.now() + ttlMs, data });
}

/* ---------- Symbol utils ---------- */
function normalizeStooqSymbol(symRaw: string) {
  let s = symRaw.trim().toLowerCase();
  if (!s.includes(".")) s += ".us";
  return s;
}

/* ---------- CSV helpers ---------- */
function parseStooqDailyCSV(csv: string): OHLC[] {
  // Columns: Date,Open,High,Low,Close,Volume
  const rows = csv.trim().split("\n");
  if (rows.length < 2) return [];
  const out: OHLC[] = [];
  for (let i = 1; i < rows.length; i++) {
    const [date, open, high, low, close, volume] = rows[i].split(",");
    const o = Number(open), h = Number(high), l = Number(low), c = Number(close), v = Number(volume);
    if (Number.isFinite(o) && Number.isFinite(c)) {
      out.push({ date, open: o, high: h, low: l, close: c, volume: v || 0 });
    }
  }
  return out;
}

/* ---------- Indicators ---------- */
function sma(values: number[], lookback: number): (number | null)[] {
  const out: (number | null)[] = Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= lookback) sum -= values[i - lookback];
    if (i >= lookback - 1) out[i] = sum / lookback;
  }
  return out;
}
function realizedVol(closes: number[], window = 20): (number | null)[] {
  // daily log-returns → rolling stdev * sqrt(252)
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const r = Math.log(closes[i] / closes[i - 1]);
    rets.push(Number.isFinite(r) ? r : 0);
  }
  const out: (number | null)[] = Array(closes.length).fill(null);
  for (let i = window; i < closes.length; i++) {
    const slice = rets.slice(i - window, i);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const varr = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / (slice.length - 1 || 1);
    const rv = Math.sqrt(varr) * Math.sqrt(252);
    out[i] = rv;
  }
  return out;
}

/* ---------- Providers ---------- */
async function stooqDaily(symbolRaw: string): Promise<OHLC[]> {
  const s = normalizeStooqSymbol(symbolRaw);
  const key = `stooq:daily:${s}`;
  const cached = getCache<OHLC[]>(key);
  if (cached) return cached;

  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(s)}&i=d`;
  const res = await fetch(url);
  const text = await res.text();
  const data = parseStooqDailyCSV(text);
  setCache(key, data, sec(120));
  return data;
}

async function yahooQuote(symbol: string): Promise<Partial<Stats & Quote>> {
  const key = `yahoo:quote:${symbol}`;
  const hit = getCache<any>(key);
  if (hit) return hit;

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error("yahoo quote failed");
    const j = await res.json();
    const q = j?.quoteResponse?.result?.[0];
    if (!q) throw new Error("yahoo no quote");

    const out: Partial<Stats & Quote> = {
      symbol: q.symbol,
      price: Number(q.regularMarketPrice),
      change: Number(q.regularMarketChange),
      changePct: Number(q.regularMarketChangePercent),
      currency: q.currency,
      time: q.regularMarketTime ? new Date(q.regularMarketTime * 1000).toISOString() : undefined,
      name: q.longName || q.shortName,
      exchange: q.fullExchangeName,
      marketCap: q.marketCap,
      trailingPE: q.trailingPE,
      forwardPE: q.forwardPE,
      dividendYield: q.trailingAnnualDividendYield,
      dividendRate: q.trailingAnnualDividendRate,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow,
    };
    setCache(key, out, sec(60));
    return out;
  } catch {
    return {};
  }
}

async function yahooOptions(symbol: string): Promise<Options | null> {
  const key = `yahoo:options:${symbol}`;
  const hit = getCache<Options>(key);
  if (hit) return hit;

  try {
    const url = `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(symbol)}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error("yahoo options failed");
    const j = await res.json();
    const root = j?.optionChain?.result?.[0];
    const last = Number(root?.quote?.regularMarketPrice);
    const opt = root?.options?.[0];
    if (!opt) throw new Error("yahoo no options");

    const calls: OptionRow[] = (opt.calls || []).map((c: any) => ({
      contractSymbol: c.contractSymbol,
      strike: Number(c.strike),
      lastPrice: Number(c.lastPrice),
      bid: Number(c.bid),
      ask: Number(c.ask),
      volume: Number(c.volume),
      openInterest: Number(c.openInterest),
      impliedVolatility: Number(c.impliedVolatility),
    }));

    const puts: OptionRow[] = (opt.puts || []).map((p: any) => ({
      contractSymbol: p.contractSymbol,
      strike: Number(p.strike),
      lastPrice: Number(p.lastPrice),
      bid: Number(p.bid),
      ask: Number(p.ask),
      volume: Number(p.volume),
      openInterest: Number(p.openInterest),
      impliedVolatility: Number(p.impliedVolatility),
    }));

    // Find ATM IV
    let ivAtm: number | undefined;
    if (Number.isFinite(last)) {
      let best: OptionRow | null = null;
      let dist = Infinity;
      for (const c of calls) {
        const d = Math.abs(c.strike - last);
        if (d < dist && Number.isFinite(c.impliedVolatility)) {
          best = c; dist = d;
        }
      }
      ivAtm = best?.impliedVolatility;
    }

    // Keep a small window around ATM (±5) to avoid huge payloads
    const near = (arr: OptionRow[]) =>
      last && Number.isFinite(last)
        ? arr
            .slice()
            .sort((a, b) => Math.abs(a.strike - last) - Math.abs(b.strike - last))
            .slice(0, 10)
        : arr.slice(0, 10);

    const out: Options = {
      asOf: new Date().toISOString(),
      underlying: symbol,
      expiration: opt.expiration ? new Date(opt.expiration * 1000).toISOString().slice(0, 10) : undefined,
      ivAtm,
      calls: near(calls),
      puts: near(puts),
    };
    setCache(key, out, sec(120));
    return out;
  } catch {
    return null;
  }
}

/* ---------- Aggregators ---------- */
async function buildQuote(symbol: string): Promise<Quote> {
  // Base from Stooq last close; enhance with Yahoo deltas if available
  const hist = await stooqDaily(symbol);
  if (!hist.length) throw new Error("Stooq: no data");
  const last = hist[hist.length - 1];
  const prev = hist[hist.length - 2] || last;
  const price = last.close;
  const change = price - prev.close;
  const changePct = prev.close ? (change / prev.close) * 100 : 0;

  const enrich = await yahooQuote(symbol);
  return {
    symbol,
    price,
    change: enrich.change ?? change,
    changePct: enrich.changePct ?? changePct,
    currency: enrich.currency || "USD",
    time: enrich.time || last.date,
  };
}

async function buildOHLC(symbol: string, days = 180) {
  const hist = await stooqDaily(symbol);
  const sliced = days > 0 ? hist.slice(-days) : hist;
  const closes = sliced.map((d) => d.close);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const rv20 = realizedVol(closes, 20);

  return {
    series: sliced,
    indicators: {
      sma20,
      sma50,
      rv20,
    },
  };
}

async function buildStats(symbol: string): Promise<Stats> {
  const enrich = await yahooQuote(symbol);
  // Try to get dividendYield from Stooq? Not available → default from yahooQuote
  return {
    name: enrich.name,
    exchange: enrich.exchange,
    currency: enrich.currency || "USD",
    marketCap: enrich.marketCap,
    trailingPE: enrich.trailingPE,
    forwardPE: enrich.forwardPE,
    dividendYield: enrich.dividendYield ?? 0.005, // graceful default
    dividendRate: enrich.dividendRate,
    fiftyTwoWeekHigh: enrich.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: enrich.fiftyTwoWeekLow,
  };
}

async function buildOptions(symbol: string) {
  const opt = await yahooOptions(symbol);
  return opt;
}

/* ---------- Handler ---------- */
export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors(), body: "" };
  }

  const action = (event.queryStringParameters?.action || "all").toLowerCase();
  const symbol = (event.queryStringParameters?.symbol || "AAPL").trim().toUpperCase();
  const days = Math.max(30, Math.min(2000, parseInt(event.queryStringParameters?.days || "180", 10) || 180));

  try {
    if (action === "quote") {
      const q = await buildQuote(symbol);
      return { statusCode: 200, headers: cors(), body: JSON.stringify(q) };
    }
    if (action === "ohlc") {
      const o = await buildOHLC(symbol, days);
      return { statusCode: 200, headers: cors(), body: JSON.stringify(o) };
    }
    if (action === "stats") {
      const s = await buildStats(symbol);
      return { statusCode: 200, headers: cors(), body: JSON.stringify(s) };
    }
    if (action === "options") {
      const o = await buildOptions(symbol);
      return { statusCode: 200, headers: cors(), body: JSON.stringify(o || { error: "options unavailable" }) };
    }

    // action === "all"
    const [quote, ohlc, stats, options] = await Promise.all([
      buildQuote(symbol),
      buildOHLC(symbol, days),
      buildStats(symbol),
      buildOptions(symbol),
    ]);

    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify({
        symbol,
        quote,
        stats,
        ohlc,
        options,
        providerNote:
          "Price/OHLC by Stooq; stats/options by Yahoo (best-effort). Indicators: SMA(20/50), 20d realized vol.",
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify({ error: err?.message || "Market API error" }),
    };
  }
};
