import React, { useMemo, useRef, useState } from "react";

/** ===============================
 *  Backtest Studio (pure React + SVG)
 *  - Candlestick chart w/ buy/sell markers near close
 *  - Equity curve (area)
 *  - Strategy: EMA Cross or RSI
 *  - Upload CSV (date,open,high,low,close) or use demo GBM
 *  - Metrics: CAGR, Sharpe, Vol, MaxDD, WinRate, Trades
 *  - “Market tape” of fills
 *  ================================= */

type Bar = { t: number; o: number; h: number; l: number; c: number };
type Series = Bar[];

type StratKind = "EMA Cross" | "RSI";

type RunParams = {
  symbol: string;
  kind: StratKind;
  fee: number;        // per trade (bps → 0.0005 = 5 bps)
  slippage: number;   // as fraction per trade (e.g. 0.0002)
  riskFree: number;   // annual rf
  // EMA
  emaFast: number;
  emaSlow: number;
  // RSI
  rsiPeriod: number;
  rsiBuy: number;
  rsiSell: number;
};

type Trade = {
  time: number;
  side: "BUY" | "SELL";
  price: number;
  qty: number;
  note?: string;
};

type Result = {
  equity: number[];        // normalized to 1
  times: number[];         // timestamps aligned with equity
  trades: Trade[];
  metrics: {
    cagr: number;
    sharpe: number;
    vol: number;
    maxdd: number;
    winRate: number;
    nTrades: number;
  };
  markers: { time: number; price: number; side: "BUY" | "SELL" }[];
};

/* ---------- Utils ---------- */
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function emaArr(src: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = new Array(src.length);
  let prev: number | undefined;
  for (let i = 0; i < src.length; i++) {
    const x = src[i];
    prev = prev === undefined ? x : prev + k * (x - prev);
    out[i] = prev;
  }
  return out;
}

function rsiArr(src: number[], period: number): number[] {
  const out: number[] = new Array(src.length).fill(NaN);
  if (src.length < period + 1) return out;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = src[i] - src[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  out[period] = 100 - 100 / (1 + rs);

  for (let i = period + 1; i < src.length; i++) {
    const diff = src[i] - src[i - 1];
    const g = Math.max(0, diff);
    const l = Math.max(0, -diff);
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    out[i] = 100 - 100 / (1 + rs);
  }
  return out;
}

function maxDrawdown(eq: number[]) {
  let peak = eq[0], mdd = 0;
  for (const v of eq) { peak = Math.max(peak, v); mdd = Math.max(mdd, (peak - v) / peak); }
  return mdd;
}

function annStats(eq: number[], times: number[], rfAnnual: number) {
  if (eq.length < 2) return { sharpe: 0, vol: 0, cagr: 0 };
  // daily log returns
  const rets: number[] = [];
  let days = 0;
  for (let i = 1; i < eq.length; i++) {
    rets.push(Math.log(eq[i] / eq[i - 1]));
    const dtDays = (times[i] - times[i - 1]) / (24 * 3600 * 1000);
    days += dtDays;
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) * (b - mean), 0) / Math.max(1, rets.length);
  const sd = Math.sqrt(variance);
  const annVol = sd * Math.sqrt(252);
  const annMean = mean * 252;
  const sharpe = annVol > 0 ? (annMean - rfAnnual) / annVol : 0;

  const years = days / 365;
  const cagr = years > 0 ? Math.pow(eq[eq.length - 1] / Math.max(1e-12, eq[0]), 1 / years) - 1 : 0;

  return { sharpe, vol: annVol, cagr };
}

/* ---------- Demo Data (GBM candles) ---------- */
function gbmClose(n: number, mu = 0.08, sigma = 0.2, start = 100) {
  const out: number[] = [start];
  for (let i = 1; i < n; i++) {
    const z = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
    const ret = (mu - 0.5 * sigma * sigma) / 252 + sigma * Math.sqrt(1 / 252) * z;
    out.push(out[i - 1] * Math.exp(ret));
  }
  return out;
}

function toCandlesFromClose(close: number[], startDate = Date.now() - close.length * 86400000): Series {
  const res: Series = [];
  for (let i = 0; i < close.length; i++) {
    const c = close[i];
    const o = i === 0 ? c : close[i - 1];
    const h = Math.max(o, c) * (1 + Math.random() * 0.003);
    const l = Math.min(o, c) * (1 - Math.random() * 0.003);
    res.push({ t: startDate + i * 86400000, o, h, l, c });
  }
  return res;
}

/* ---------- Backtest Engine (long/flat) ---------- */
function runBacktest(bars: Series, p: RunParams): Result {
  const c = bars.map(b => b.c);
  const times = bars.map(b => b.t);

  let long = false;
  let cash = 1;     // equity normalized
  let pos = 0;      // fraction exposure [0..1]
  let lastPrice = c[0];

  const equity: number[] = [cash];
  const trades: Trade[] = [];
  const markers: Result["markers"] = [];

  // signals
  let buySignal = false;
  let sellSignal = false;

  // Strategy pre-calc
  const emaF = p.kind === "EMA Cross" ? emaArr(c, p.emaFast) : [];
  const emaS = p.kind === "EMA Cross" ? emaArr(c, p.emaSlow) : [];
  const rsiV = p.kind === "RSI" ? rsiArr(c, p.rsiPeriod) : [];

  for (let i = 1; i < bars.length; i++) {
    const price = c[i];

    buySignal = false;
    sellSignal = false;

    if (p.kind === "EMA Cross") {
      if (isFinite(emaF[i]) && isFinite(emaS[i]) && isFinite(emaF[i - 1]) && isFinite(emaS[i - 1])) {
        const prevDiff = emaF[i - 1] - emaS[i - 1];
        const diff = emaF[i] - emaS[i];
        if (prevDiff <= 0 && diff > 0) buySignal = true;
        if (prevDiff >= 0 && diff < 0) sellSignal = true;
      }
    } else {
      const r0 = rsiV[i - 1], r1 = rsiV[i];
      if (isFinite(r0) && isFinite(r1)) {
        if (r0 < p.rsiBuy && r1 >= p.rsiBuy) buySignal = true;
        if (r0 > p.rsiSell && r1 <= p.rsiSell) sellSignal = true;
      }
    }

    // exec signals
    if (!long && buySignal) {
      long = true; pos = 1;
      const fill = price * (1 + p.slippage);
      cash = cash * (1 - p.fee) / (price / fill); // pay fee + buy at worse price
      trades.push({ time: times[i], side: "BUY", price: fill, qty: 1 });
      markers.push({ time: times[i], price: bars[i].c, side: "BUY" }); // marker near close
    } else if (long && sellSignal) {
      long = false; pos = 0;
      const fill = price * (1 - p.slippage);
      cash = cash * (fill / price) * (1 - p.fee); // sell with fee
      trades.push({ time: times[i], side: "SELL", price: fill, qty: 1 });
      markers.push({ time: times[i], price: bars[i].c, side: "SELL" });
    }

    // mark to market (when long, equity tracks price)
    if (pos === 1) {
      cash *= price / lastPrice;
    }
    equity.push(cash);
    lastPrice = price;
  }

  const { sharpe, vol, cagr } = annStats(equity, times, p.riskFree);
  const mdd = maxDrawdown(equity);
  const wins = trades.filter((t, idx) => t.side === "SELL" && trades[idx - 1]?.side === "BUY").length; // crude
  const nTrades = trades.length;

  return {
    equity,
    times,
    trades,
    markers,
    metrics: {
      cagr, sharpe, vol, maxdd: mdd,
      winRate: nTrades ? (wins / Math.max(1, nTrades / 2)) : 0,
      nTrades,
    },
  };
}

/* ---------- CSV Ingest ---------- */
function parseCSV(text: string): Series {
  // expects header like: date,open,high,low,close  (order-insensitive)
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const head = lines[0].toLowerCase().split(",").map(s => s.trim());
  const idx = {
    d: head.indexOf("date"),
    o: head.indexOf("open"),
    h: head.indexOf("high"),
    l: head.indexOf("low"),
    c: head.indexOf("close"),
  };
  const out: Series = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(s => s.trim());
    const t = new Date(cols[idx.d]).getTime();
    const o = parseFloat(cols[idx.o]);
    const h = parseFloat(cols[idx.h]);
    const l = parseFloat(cols[idx.l]);
    const c = parseFloat(cols[idx.c]);
    if (isFinite(t) && isFinite(o) && isFinite(h) && isFinite(l) && isFinite(c)) {
      out.push({ t, o, h, l, c });
    }
  }
  out.sort((a, b) => a.t - b.t);
  return out;
}

/* ---------- SVG Charts ---------- */
function AxisDate(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CandleChart({
  data, markers, height = 260,
}: { data: Series; markers: Result["markers"]; height?: number }) {
  if (!data.length) return <div style={{ height }} />;
  const w = 820;
  const pad = 8;
  const minP = Math.min(...data.map(d => d.l));
  const maxP = Math.max(...data.map(d => d.h));
  const y = (p: number) => pad + (1 - (p - minP) / (maxP - minP)) * (height - 2 * pad);
  const x = (i: number) => pad + (i / (data.length - 1)) * (w - 2 * pad);

  const candleW = Math.max(1, (w - 2 * pad) / data.length * 0.6);

  return (
    <svg width={w} height={height} style={{ display: "block" }}>
      {/* grid */}
      {[0.25, 0.5, 0.75].map((g, i) => (
        <line key={i} x1={pad} x2={w - pad} y1={pad + g * (height - 2 * pad)} y2={pad + g * (height - 2 * pad)}
          stroke="rgba(120,170,220,.18)" strokeDasharray="4 4"/>
      ))}
      {/* candles */}
      {data.map((d, i) => {
        const up = d.c >= d.o;
        const cx = x(i);
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={y(d.h)} y2={y(d.l)} stroke={up ? "#21e087" : "#ff6b6b"} strokeWidth={1}/>
            <rect x={cx - candleW / 2} y={y(up ? d.c : d.o)}
                  width={candleW} height={Math.max(1, Math.abs(y(d.c) - y(d.o)))}
                  fill={up ? "rgba(33,224,135,.9)" : "rgba(255,107,107,.9)"} />
          </g>
        );
      })}
      {/* markers near close */}
      {markers.map((m, k) => {
        const i = data.findIndex(b => b.t === m.time);
        if (i < 0) return null;
        const cx = x(i);
        const cy = y(m.price);
        const label = m.side === "BUY" ? "▲ BUY" : "▼ SELL";
        const color = m.side === "BUY" ? "#21e087" : "#ff6b6b";
        const dy = m.side === "BUY" ? 16 : -16;
        return (
          <g key={k}>
            <text x={cx + 6} y={cy + dy} fill={color} fontSize="11" fontWeight={800}>{label}</text>
            <circle cx={cx} cy={cy} r={3} fill={color}/>
          </g>
        );
      })}
    </svg>
  );
}

function AreaChart({ data, height = 120 }: { data: number[]; height?: number }) {
  if (!data.length) return <div style={{ height }} />;
  const w = 820, pad = 8;
  const min = Math.min(...data), max = Math.max(...data);
  const x = (i: number) => pad + (i / (data.length - 1)) * (w - 2 * pad);
  const y = (v: number) => pad + (1 - (v - min) / (max - min)) * (height - 2 * pad);

  const path = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const base = `${x(data.length - 1)},${y(min)} L${x(0)},${y(min)} Z`;

  return (
    <svg width={w} height={height} style={{ display: "block" }}>
      <path d={path} stroke="#3ecbff" fill="none" strokeWidth={2}/>
      <path d={path + " " + base} fill="rgba(62,203,255,.12)"/>
    </svg>
  );
}

/* ---------- Main Component ---------- */
export default function BacktestStudio() {
  const [bars, setBars] = useState<Series>(() => {
    const demo = gbmClose(300, 0.12, 0.25, 100);
    return toCandlesFromClose(demo);
  });

  const [p, setP] = useState<RunParams>({
    symbol: "DEMO",
    kind: "EMA Cross",
    fee: 0.0005,
    slippage: 0.0002,
    riskFree: 0.02,
    emaFast: 12,
    emaSlow: 26,
    rsiPeriod: 14,
    rsiBuy: 30,
    rsiSell: 70,
  });

  const result = useMemo(() => runBacktest(bars, p), [bars, p]);

  const onCSV = async (file: File) => {
    const text = await file.text();
    const s = parseCSV(text);
    if (s.length > 0) {
      setBars(s);
      setP(pr => ({ ...pr, symbol: file.name.replace(/\.\w+$/, "").toUpperCase() }));
    } else {
      alert("Could not parse CSV. Expect columns: date,open,high,low,close");
    }
  };

  const fmtPct = (x: number) => (x * 100).toFixed(2) + "%";
  const fmt2 = (x: number) => x.toFixed(2);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14 }}>
      {/* Left column: charts */}
      <div className="panel" style={{ padding: 14, display: "grid", gap: 12 }}>
        <div className="panelHeader" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            Backtest Studio <span className="lux-chip">Modern</span>
            <span className="lux-chip" style={{ marginLeft: 8 }}>{p.symbol}</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label className="btn-ghost-blue" style={{ cursor: "pointer" }}>
              Upload CSV
              <input type="file" accept=".csv" style={{ display: "none" }} onChange={e => e.target.files && onCSV(e.target.files[0])} />
            </label>
            <a className="btn-neo-blue" href="/pricing-labs">Get Pro</a>
          </div>
        </div>

        {/* Candles + markers */}
        <div className="panel" style={{ padding: 12 }}>
          <div className="panelHeader">Price (candles)</div>
          <CandleChart data={bars} markers={result.markers} />
        </div>

        {/* Equity curve */}
        <div className="panel" style={{ padding: 12 }}>
          <div className="panelHeader">Equity Curve</div>
          <AreaChart data={result.equity} />
        </div>

        {/* Market tape */}
        <div className="panel" style={{ padding: 12 }}>
          <div className="panelHeader">Trade Tape</div>
          <div className="panelBody" style={{ display: "grid", gap: 6 }}>
            {result.trades.length === 0 && <div style={{ opacity: .7 }}>No trades yet (try different parameters).</div>}
            {result.trades.slice(-10).reverse().map((t, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "140px 60px 1fr", gap: 8,
                fontFamily: "ui-monospace, monospace", fontSize: 13
              }}>
                <div style={{ opacity: .7 }}>{new Date(t.time).toLocaleDateString()}</div>
                <div style={{ color: t.side === "BUY" ? "#21e087" : "#ff6b6b", fontWeight: 700 }}>{t.side}</div>
                <div>Price {fmt2(t.price)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column: controls + metrics */}
      <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <div className="panel" style={{ padding: 14 }}>
          <div className="panelHeader">Strategy</div>
          <div className="panelBody" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={p.kind === "EMA Cross" ? "btn-neo-blue" : "btn-ghost-blue"} onClick={() => setP({ ...p, kind: "EMA Cross" })}>EMA Cross</button>
              <button className={p.kind === "RSI" ? "btn-neo-blue" : "btn-ghost-blue"} onClick={() => setP({ ...p, kind: "RSI" })}>RSI</button>
            </div>

            {p.kind === "EMA Cross" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>EMA Fast</span>
                  <input className="num" type="number" min={2} max={200} value={p.emaFast}
                         onChange={e => setP({ ...p, emaFast: clamp(parseInt(e.target.value || "1"), 2, 200) })} />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>EMA Slow</span>
                  <input className="num" type="number" min={3} max={300} value={p.emaSlow}
                         onChange={e => setP({ ...p, emaSlow: clamp(parseInt(e.target.value || "1"), 3, 300) })} />
                </label>
              </div>
            )}

            {p.kind === "RSI" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>Period</span>
                  <input className="num" type="number" min={2} max={100} value={p.rsiPeriod}
                         onChange={e => setP({ ...p, rsiPeriod: clamp(parseInt(e.target.value || "1"), 2, 100) })} />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>Buy ≤</span>
                  <input className="num" type="number" min={1} max={99} value={p.rsiBuy}
                         onChange={e => setP({ ...p, rsiBuy: clamp(parseInt(e.target.value || "1"), 1, 99) })} />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>Sell ≥</span>
                  <input className="num" type="number" min={1} max={99} value={p.rsiSell}
                         onChange={e => setP({ ...p, rsiSell: clamp(parseInt(e.target.value || "1"), 1, 99) })} />
                </label>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <label style={{ display: "grid", gap: 4 }}>
                <span>Fee (bps)</span>
                <input className="num" type="number" step="0.0001" value={p.fee}
                       onChange={e => setP({ ...p, fee: parseFloat(e.target.value || "0") })} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span>Slippage</span>
                <input className="num" type="number" step="0.0001" value={p.slippage}
                       onChange={e => setP({ ...p, slippage: parseFloat(e.target.value || "0") })} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span>Risk-free</span>
                <input className="num" type="number" step="0.005" value={p.riskFree}
                       onChange={e => setP({ ...p, riskFree: parseFloat(e.target.value || "0") })} />
              </label>
            </div>

            <div className="hint-box" style={{ marginTop: 6 }}>
              Signals plot next to the **close** at each time *t*. Try widening EMA gap or RSI thresholds if no trades appear.
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: 14 }}>
          <div className="panelHeader">Metrics</div>
          <div className="panelBody" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            <MiniStat k="CAGR" v={fmtPct(result.metrics.cagr)} />
            <MiniStat k="Sharpe" v={fmt2(result.metrics.sharpe)} />
            <MiniStat k="Volatility" v={fmtPct(result.metrics.vol)} />
            <MiniStat k="Max DD" v={fmtPct(result.metrics.maxdd)} />
            <MiniStat k="Win Rate" v={fmtPct(result.metrics.winRate)} />
            <MiniStat k="Trades" v={String(result.metrics.nTrades)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="panel" style={{ padding: 10 }}>
      <div style={{ opacity: .7, fontSize: 12 }}>{k}</div>
      <div style={{ fontWeight: 800, fontSize: 18 }}>{v}</div>
    </div>
  );
}
