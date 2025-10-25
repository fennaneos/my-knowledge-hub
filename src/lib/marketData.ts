// src/lib/marketData.ts
export type OHLC = { t: number[]; c: number[] };

declare global {
  interface Window {
    __MARKET_FETCH__?: (symbol: string, lookbackDays?: number) => Promise<OHLC>;
  }
}

/* ---------- helpers ---------- */
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function gbm(days = 180, s0 = 100): OHLC {
  const t: number[] = [];
  const c: number[] = [];
  const start = Date.now() - days * 86400000;
  let s = s0;
  for (let i = 0; i < days; i++) {
    const u1 = Math.random(), u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const mu = 0.10, sigma = 0.25;
    const ret = (mu - 0.5 * sigma * sigma) / 252 + sigma * Math.sqrt(1 / 252) * z;
    s *= Math.exp(ret);
    t.push(start + i * 86400000);
    c.push(s);
  }
  return { t, c };
}

/* ---------- main loaders ---------- */
export async function loadSeries(symbol: string, days = 180): Promise<OHLC> {
  const d = clamp(days, 30, 720);
  if (typeof window !== "undefined" && typeof window.__MARKET_FETCH__ === "function") {
    try {
      const res = await window.__MARKET_FETCH__(symbol, d);
      if (res?.t?.length && res?.c?.length) return res;
    } catch {}
  }
  // fallback GBM so UI keeps working
  const base = /USD|USDT|SOFR|EURIBOR/.test(symbol) ? 1 : 100 + Math.random() * 80;
  return gbm(d, base);
}

export async function loadMany(symbols: string[], days = 180): Promise<Record<string, OHLC>> {
  const out: Record<string, OHLC> = {};
  for (const s of symbols) out[s] = await loadSeries(s, days);
  return out;
}

/* ---------- simple analytics ---------- */
export function lastAndChange(s: OHLC) {
  const n = s.c.length;
  if (n < 2) return { last: NaN, chg: NaN, chgPct: NaN };
  const last = s.c[n - 1];
  const prev = s.c[n - 2];
  const chg = last - prev;
  const chgPct = prev !== 0 ? chg / prev : NaN;
  return { last, chg, chgPct };
}

export function pctReturn(s: OHLC, lookbackDays: number) {
  const n = s.c.length;
  const k = Math.max(1, Math.min(lookbackDays, n - 1));
  const last = s.c[n - 1], base = s.c[n - 1 - k];
  return base !== 0 ? (last - base) / base : NaN;
}

export function realizedVol(s: OHLC, windowDays = 30) {
  const n = s.c.length;
  if (n < 2) return NaN;
  const w = Math.max(2, Math.min(windowDays, n - 1));
  const rets: number[] = [];
  for (let i = n - w; i < n; i++) {
    const r = Math.log(s.c[i] / s.c[i - 1]);
    if (Number.isFinite(r)) rets.push(r);
  }
  if (!rets.length) return NaN;
  const mu = rets.reduce((a, b) => a + b, 0) / rets.length;
  const varr = rets.reduce((a, b) => a + (b - mu) * (b - mu), 0) / rets.length;
  const sd = Math.sqrt(varr);
  return sd * Math.sqrt(252);
}

/** Pearson correlation between two arrays (same length). */
export function pearson(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  if (n === 0) return NaN;
  const ma = a.reduce((x, y) => x + y, 0) / n;
  const mb = b.reduce((x, y) => x + y, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - ma, xb = b[i] - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  const den = Math.sqrt(da * db);
  return den ? num / den : NaN;
}
