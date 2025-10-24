import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "@theme/Layout";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  UTCTimestamp,
} from "lightweight-charts";

/* ---------------------------
   Types
---------------------------- */
type Bar = { t: number; o: number; h: number; l: number; c: number };
type Series = Bar[];
type Side = "BUY" | "SELL";

type Position = { symbol: string; qty: number; avg: number; mark?: number };
type Trade = { ts: number; symbol: string; side: Side; qty: number; price: number; note?: string };

/* ---------------------------
   Small utils
---------------------------- */
const COMMON = ["EURUSD", "USDJPY", "XAUUSD", "BTCUSD", "ETHUSD", "SPX"];
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function emaArr(src: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out = new Array(src.length);
  let prev: number | undefined;
  for (let i = 0; i < src.length; i++) {
    const x = src[i];
    prev = prev === undefined ? x : prev + k * (x - prev);
    out[i] = prev;
  }
  return out;
}

/* Demo data (offline): GBM close → fake candles */
function gbmClose(n: number, mu = 0.10, sigma = 0.22, start = 100) {
  const out = [start];
  for (let i = 1; i < n; i++) {
    const z = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
    const ret = (mu - 0.5 * sigma * sigma) / 252 + sigma * Math.sqrt(1 / 252) * z;
    out.push(out[i - 1] * Math.exp(ret));
  }
  return out;
}
function toCandlesFromClose(close: number[], start = Date.now() - close.length * 86400000): Series {
  const res: Series = [];
  for (let i = 0; i < close.length; i++) {
    const c = close[i];
    const o = i === 0 ? c : close[i - 1];
    const h = Math.max(o, c) * (1 + Math.random() * 0.004);
    const l = Math.min(o, c) * (1 - Math.random() * 0.004);
    res.push({ t: start + i * 86400000, o, h, l, c });
  }
  return res;
}

/* ---------------------------
   Virtual Trading State (local to page)
---------------------------- */
function useVirtualStore() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<Trade[]>([]);
  const [lastMarks, setLastMarks] = useState<Record<string, number>>({});

  const markPrice = (symbol: string, price: number) => {
    setLastMarks((m) => ({ ...m, [symbol]: price }));
    setPositions((prev) =>
      prev.map((p) => (p.symbol === symbol ? { ...p, mark: price } : p))
    );
  };

  const placeMarket = (symbol: string, side: Side, qty: number, price: number, note?: string) => {
    setHistory((h) => [...h, { ts: Date.now(), symbol, side, qty, price, note }]);
    setPositions((prev) => {
      const p = prev.find((x) => x.symbol === symbol);
      const signedQty = side === "BUY" ? qty : -qty;
      if (!p) {
        if (side === "SELL") {
          // allow short for demo: negative qty, avg = price
          return [...prev, { symbol, qty: -qty, avg: price, mark: lastMarks[symbol] ?? price }];
        }
        return [...prev, { symbol, qty, avg: price, mark: lastMarks[symbol] ?? price }];
      } else {
        const newQty = p.qty + signedQty;
        if (newQty === 0) {
          return prev.filter((x) => x.symbol !== symbol);
        }
        let newAvg = p.avg;
        if ((p.qty >= 0 && side === "BUY") || (p.qty <= 0 && side === "SELL")) {
          // add to same direction → re-average
          const costOld = Math.abs(p.qty) * p.avg;
          const costNew = Math.abs(signedQty) * price;
          const totalQty = Math.abs(p.qty) + Math.abs(signedQty);
          newAvg = (costOld + costNew) / Math.max(1, totalQty);
        } else {
          // reducing / flipping → keep old avg for remaining side (simple demo model)
          newAvg = newQty === 0 ? 0 : p.avg;
        }
        return prev.map((x) =>
          x.symbol === symbol ? { ...x, qty: newQty, avg: newAvg, mark: lastMarks[symbol] ?? price } : x
        );
      }
    });
  };

  return { positions, history, lastMarks, markPrice, placeMarket };
}

/* ---------------------------
   Page Component
---------------------------- */
export default function VirtualTradingPage() {
  const [symbol, setSymbol] = useState("EURUSD");
  const [watch, setWatch] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("vt:watch");
      return saved ? JSON.parse(saved) : COMMON;
    } catch {
      return COMMON;
    }
  });
  useEffect(() => localStorage.setItem("vt:watch", JSON.stringify(watch)), [watch]);

  const [tf, setTf] = useState<"1d" | "4h" | "1h">("1d");
  const [emaFastP, setEmaFastP] = useState(9);
  const [emaSlowP, setEmaSlowP] = useState(21);
  const [qty, setQty] = useState(1);

  // synthetic candles per symbol (offline demo)
  const [bars, setBars] = useState<Series>(() => toCandlesFromClose(gbmClose(300)));
  useEffect(() => {
    // reset candles when symbol or tf changes (demo)
    const n = tf === "1d" ? 300 : tf === "4h" ? 500 : 700;
    setBars(toCandlesFromClose(gbmClose(n)));
  }, [symbol, tf]);

  const close = useMemo(() => bars.map((b) => b.c), [bars]);
  const emaF = useMemo(() => emaArr(close, emaFastP), [close, emaFastP]);
  const emaS = useMemo(() => emaArr(close, emaSlowP), [close, emaSlowP]);

  const { positions, history, markPrice, placeMarket } = useVirtualStore();

  // last price
  const last = close.length ? close[close.length - 1] : 0;
  useEffect(() => {
    if (!symbol || !last) return;
    markPrice(symbol, last);
  }, [symbol, last]);

  /* ---- CHARTS ---- */
  const priceRef = useRef<HTMLDivElement | null>(null);
  const priceChart = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const emaFastSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const emaSlowSeries = useRef<ISeriesApi<"Line"> | null>(null);

  // init chart once
  useEffect(() => {
    if (!priceRef.current) return;
    const pc = createChart(priceRef.current, {
      layout: { background: { color: "#0b1320" }, textColor: "#d2e6ff" },
      grid: { horzLines: { color: "#11243b" }, vertLines: { color: "#11243b" } },
      rightPriceScale: { borderColor: "#1d3559" },
      timeScale: { borderColor: "#1d3559" },
      crosshair: { mode: 1 },
      width: priceRef.current.clientWidth,
      height: 360,
    });
    priceChart.current = pc;
    candleSeries.current = pc.addCandlestickSeries({
      upColor: "#21e087",
      downColor: "#ff6b6b",
      borderUpColor: "#21e087",
      borderDownColor: "#ff6b6b",
      wickUpColor: "#21e087",
      wickDownColor: "#ff6b6b",
    });
    emaFastSeries.current = pc.addLineSeries({ lineWidth: 2, color: "#48fffb" });
    emaSlowSeries.current = pc.addLineSeries({ lineWidth: 2, color: "#a472ff" });

    const onResize = () => {
      if (priceChart.current && priceRef.current)
        priceChart.current.applyOptions({ width: priceRef.current.clientWidth });
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(priceRef.current);

    return () => {
      ro.disconnect();
      priceChart.current?.remove();
      priceChart.current = null;
    };
  }, []);

  // set chart data whenever bars/EMAs change
  useEffect(() => {
    if (!priceChart.current || !candleSeries.current) return;
    const data = bars.map((b) => ({
      time: Math.floor(b.t / 1000) as UTCTimestamp,
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
    }));
    candleSeries.current.setData(data);

    if (emaFastSeries.current) {
      const lf = emaF.map((v, i) => ({ time: data[i].time, value: v })) as LineData[];
      emaFastSeries.current.setData(lf);
    }
    if (emaSlowSeries.current) {
      const ls = emaS.map((v, i) => ({ time: data[i].time, value: v })) as LineData[];
      emaSlowSeries.current.setData(ls);
    }

    priceChart.current.timeScale().fitContent();
  }, [bars, emaF, emaS]);

  /* ---- Trading handlers ---- */
  const onBuy = () => placeMarket(symbol, "BUY", qty, last, "Chart");
  const onSell = () => placeMarket(symbol, "SELL", qty, last, "Chart");

  /* ---- Derived metrics ---- */
  const posForSym = positions.find((p) => p.symbol === symbol);
  const upnl = posForSym ? (posForSym.mark ?? last) - posForSym.avg : 0;
  const upnlAbs = posForSym ? upnl * posForSym.qty : 0;

  /* ---- UI ---- */
  return (
    <Layout title="Virtual Trading" description="Watchlist, chart, trades, positions — in one page">
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px" }}>
        {/* Header / Hero */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div className="lux-chip">Virtual</div>
            <h1 style={{ margin: 0 }}>Virtual Trading Desk</h1>
            <div style={{ opacity: 0.8, maxWidth: 720 }}>
              Lightweight demo of your trading page: pick a symbol, see EMA(9/21), place paper trades, track positions & history. No backend needed.
            </div>
          </div>
          <div className="cta-group" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a className="btn-neo-blue" href="/pricing-labs">Get Pro</a>
            <a className="btn-ghost-blue" href="/lab">Open Lab</a>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 }}>
          {/* LEFT: Chart + Ticket */}
          <div className="panel" style={{ display: "grid", gap: 10, padding: 12 }}>
            {/* Controls row */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div className="lux-chip">Symbol</div>
              <select className="lux-select" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                {watch.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>

              <div className="lux-chip">TF</div>
              {(["1d", "4h", "1h"] as const).map((t) => (
                <button
                  key={t}
                  className={tf === t ? "btn-neo-blue" : "btn-ghost-blue"}
                  onClick={() => setTf(t)}
                >
                  {t}
                </button>
              ))}

              <div className="lux-chip">EMA</div>
              <input
                className="num"
                style={{ width: 64 }}
                type="number"
                min={2}
                max={100}
                value={emaFastP}
                onChange={(e) => setEmaFastP(clamp(parseInt(e.target.value || "1"), 2, 100))}
                title="Fast EMA"
              />
              <input
                className="num"
                style={{ width: 64 }}
                type="number"
                min={3}
                max={300}
                value={emaSlowP}
                onChange={(e) => setEmaSlowP(clamp(parseInt(e.target.value || "1"), 3, 300))}
                title="Slow EMA"
              />
            </div>

            {/* Chart */}
            <div ref={priceRef} style={{ width: "100%", height: 360 }} />

            {/* Trading ticket */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <div style={{ opacity: 0.7 }}>Last:</div>
                <div style={{ fontWeight: 800, fontSize: 20 }}>{last ? last.toFixed(2) : "--"}</div>
                <div className="lux-chip">EMA9 {emaF.length ? emaF[emaF.length - 1].toFixed(2) : "--"}</div>
                <div className="lux-chip">EMA21 {emaS.length ? emaS[emaS.length - 1].toFixed(2) : "--"}</div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ opacity: 0.7 }}>Qty</span>
                <input
                  className="num"
                  style={{ width: 64 }}
                  type="number"
                  min={1}
                  max={1000}
                  value={qty}
                  onChange={(e) => setQty(clamp(parseInt(e.target.value || "1"), 1, 1000))}
                />
                <button className="lux-btn" onClick={onBuy}>
                  Buy @ {last ? last.toFixed(2) : "--"}
                </button>
                <button className="lux-outline danger" onClick={onSell}>
                  Sell @ {last ? last.toFixed(2) : "--"}
                </button>
              </div>
            </div>

            {/* Position summary (selected symbol) */}
            <div className="panel" style={{ padding: 10, display: "flex", gap: 16, alignItems: "baseline" }}>
              <div className="lux-chip">{symbol}</div>
              <div>Pos: <b>{posForSym ? posForSym.qty : 0}</b></div>
              <div>Avg: <b>{posForSym && posForSym.qty !== 0 ? posForSym.avg.toFixed(2) : "--"}</b></div>
              <div>Mark: <b>{last ? last.toFixed(2) : "--"}</b></div>
              <div>
                uPnL:{" "}
                <b style={{ color: upnlAbs >= 0 ? "#21e087" : "#ff6b6b" }}>
                  {posForSym ? upnlAbs.toFixed(2) : "0.00"}
                </b>
              </div>
            </div>
          </div>

          {/* RIGHT: Watchlist + Positions + History */}
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            {/* Watchlist */}
            <div className="panel" style={{ padding: 12 }}>
              <div className="panelHeader">Watchlist</div>
              <div className="panelBody" style={{ display: "grid", gap: 8 }}>
                {watch.map((s) => (
                  <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button className={symbol === s ? "btn-neo-blue" : "btn-ghost-blue"} onClick={() => setSymbol(s)}>
                        {s}
                      </button>
                    </div>
                    <button className="lux-ghost" onClick={() => setWatch((w) => w.filter((x) => x !== s))}>
                      Remove
                    </button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6 }}>
                  <input id="symIn" className="input" placeholder="Add symbol (e.g. BTCUSD)" />
                  <button
                    className="lux-btn"
                    onClick={() => {
                      const el = document.getElementById("symIn") as HTMLInputElement;
                      const s = (el?.value || "").toUpperCase().replace(/\s+/g, "");
                      if (s && !watch.includes(s)) setWatch((w) => [...w, s]);
                      if (el) el.value = "";
                    }}
                  >
                    Add
                  </button>
                </div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>
                  FYI: This demo watchlist is client-side only (localStorage).
                </div>
              </div>
            </div>

            {/* Positions */}
            <div className="panel" style={{ padding: 12 }}>
              <div className="panelHeader">Positions</div>
              <div className="panelBody" style={{ display: "grid", gap: 6, fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
                {positions.length === 0 && <div style={{ opacity: 0.7 }}>No positions.</div>}
                {positions.map((p) => {
                  const mark = p.mark ?? p.avg;
                  const pnl = (mark - p.avg) * p.qty;
                  return (
                    <div key={p.symbol} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 1fr", gap: 8 }}>
                      <div style={{ opacity: 0.7 }}>{p.symbol}</div>
                      <div>qty {p.qty}</div>
                      <div>avg {p.avg.toFixed(2)}</div>
                      <div>mark {mark.toFixed(2)}</div>
                      <div style={{ color: pnl >= 0 ? "#21e087" : "#ff6b6b" }}>PnL {pnl.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trade history */}
            <div className="panel" style={{ padding: 12 }}>
              <div className="panelHeader">Trade History</div>
              <div className="panelBody" style={{ display: "grid", gap: 6, fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
                {history.length === 0 && <div style={{ opacity: 0.7 }}>No trades yet.</div>}
                {history.slice(-14).reverse().map((t, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 70px 1fr", gap: 8 }}>
                    <div style={{ opacity: 0.7 }}>{new Date(t.ts).toLocaleDateString()}</div>
                    <div style={{ color: t.side === "BUY" ? "#21e087" : "#ff6b6b", fontWeight: 800 }}>
                      {t.side}
                    </div>
                    <div>
                      {t.symbol} @ {t.price.toFixed(2)} (qty {t.qty})
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learn / Links */}
            <div className="panel" style={{ padding: 12 }}>
              <div className="panelHeader">Learn</div>
              <div className="panelBody" style={{ display: "grid", gap: 8 }}>
                <a className="btn-ghost-blue" href="/finance/ema-macd-strategy">EMA / MACD Strategy</a>
                <a className="btn-ghost-blue" href="/lab">Monte Carlo Lab</a>
                <a className="btn-neo-red-modern" href="/pricing-labs">Upgrade to Pro</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
