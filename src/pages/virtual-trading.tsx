import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "@theme/Layout";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  UTCTimestamp,
} from "lightweight-charts";

/* =======================  helpers ======================= */

type Bar = { t: number; o: number; h: number; l: number; c: number };
type Series = Bar[];
type Side = "BUY" | "SELL";
type Position = { qty: number; avg: number };
type Trade = { ts: number; side: Side; price: number; qty: number; note?: string; eqAfter: number };

const bronze = "#c99a3b";
const bronzeGlow = "rgba(201,154,59,.25)";
const panelBg = "#0d1424";
const boxBg = "#0a1020";
const gridDark = "#12223c";
const textSoft = "#bcd3ff";

const COMMON = ["BTCUSD", "ETHUSD", "EURUSD", "USDJPY"];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSeededSeries(
  n: number,
  seed: number,
  startTs: number,
  dtMs: number,
  startPrice = 10000,
  mu = 0.10,
  sigma = 0.22
): Series {
  const rnd = mulberry32(seed);
  const out: Series = [];
  let p = startPrice;
  for (let i = 0; i < n; i++) {
    const u = Math.max(1e-9, rnd());
    const v = Math.max(1e-9, rnd());
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    const ret = (mu - 0.5 * sigma * sigma) / 252 + sigma * Math.sqrt(1 / 252) * z;
    const prev = p;
    p = prev * Math.exp(ret);
    const t = startTs + i * dtMs;
    const o = prev;
    const c = p;
    const h = Math.max(o, c) * (1 + 0.003 * rnd());
    const l = Math.min(o, c) * (1 - 0.003 * rnd());
    out.push({ t, o, h, l, c });
  }
  return out;
}

/* =======================  game store ======================= */

type GameState = {
  startCash: number;
  cash: number;
  position: Position | null;
  trades: Trade[];
  bestEquity: number;
  wins: number;
  losses: number;
  streak: number; // + = win streak, - = loss streak
};

function useGame(initialCash = 10000) {
  const [state, setState] = useState<GameState>({
    startCash: initialCash,
    cash: initialCash,
    position: null,
    trades: [],
    bestEquity: initialCash,
    wins: 0,
    losses: 0,
    streak: 0,
  });

  const equityFromMark = (mark: number) =>
    state.cash + (state.position ? state.position.qty * mark : 0);

  const realizeWinLoss = (realized: number, s: GameState) => {
    let wins = s.wins,
      losses = s.losses,
      streak = s.streak;
    if (realized >= 0) {
      wins++;
      streak = streak >= 0 ? streak + 1 : 1;
    } else {
      losses++;
      streak = streak <= 0 ? streak - 1 : -1;
    }
    return { wins, losses, streak };
  };

  // BUY: open/add long, reduce short, or flip short->long
  const buy = (px: number, qty: number, note?: string) => {
    setState((s) => {
      if (qty <= 0) return s;
      const cost = qty * px;
      if (cost > s.cash) return s;

      const pos = s.position;
      let newCash = s.cash - cost;
      let newPos: Position | null;
      let realized = 0;

      if (!pos || pos.qty === 0) {
        newPos = { qty, avg: px };
      } else if (pos.qty > 0) {
        const total = pos.qty + qty;
        const avg = (pos.avg * pos.qty + qty * px) / total;
        newPos = { qty: total, avg };
      } else {
        const cover = Math.min(qty, Math.abs(pos.qty));
        realized = (pos.avg - px) * cover; // short PnL
        const remainingShort = pos.qty + cover;
        if (qty > Math.abs(pos.qty)) {
          const leftover = qty - Math.abs(pos.qty);
          newPos = { qty: leftover, avg: px };
        } else {
          newPos = remainingShort === 0 ? null : { qty: remainingShort, avg: pos.avg };
        }
      }

      const eq = newCash + (newPos ? newPos.qty * px : 0);
      const bestEquity = Math.max(eq, s.bestEquity);

      let wins = s.wins,
        losses = s.losses,
        streak = s.streak;
      if (realized !== 0) {
        const res = realizeWinLoss(realized, s);
        wins = res.wins;
        losses = res.losses;
        streak = res.streak;
      }

      return {
        ...s,
        cash: newCash,
        position: newPos,
        bestEquity,
        wins,
        losses,
        streak,
        trades: [...s.trades, { ts: Date.now(), side: "BUY", price: px, qty, note, eqAfter: eq }],
      };
    });
  };

  // SELL: open/add short, reduce long, or flip long->short
  const sell = (px: number, qty: number, note?: string) => {
    setState((s) => {
      if (qty <= 0) return s;

      const proceeds = qty * px;
      const pos = s.position;
      let newCash = s.cash + proceeds;
      let newPos: Position | null;
      let realized = 0;

      if (!pos || pos.qty === 0) {
        newPos = { qty: -qty, avg: px }; // open short
      } else if (pos.qty < 0) {
        const total = Math.abs(pos.qty) + qty;
        const avg = (pos.avg * Math.abs(pos.qty) + qty * px) / total;
        newPos = { qty: -total, avg };
      } else {
        const closeQty = Math.min(qty, pos.qty);
        realized = (px - pos.avg) * closeQty; // long PnL
        const remainingLong = pos.qty - closeQty;

        if (qty > pos.qty) {
          const leftover = qty - pos.qty;
          newPos = { qty: -leftover, avg: px }; // flip to short
        } else {
          newPos = remainingLong === 0 ? null : { qty: remainingLong, avg: pos.avg };
        }
      }

      const eq = newCash + (newPos ? newPos.qty * px : 0);
      const bestEquity = Math.max(eq, s.bestEquity);

      let wins = s.wins,
        losses = s.losses,
        streak = s.streak;
      if (realized !== 0) {
        const res = realizeWinLoss(realized, s);
        wins = res.wins;
        losses = res.losses;
        streak = res.streak;
      }

      return {
        ...s,
        cash: newCash,
        position: newPos,
        bestEquity,
        wins,
        losses,
        streak,
        trades: [...s.trades, { ts: Date.now(), side: "SELL", price: px, qty, note, eqAfter: eq }],
      };
    });
  };

  // Close everything at price
  const closeAll = (px: number) => {
    setState((s) => {
      const pos = s.position;
      if (!pos || pos.qty === 0) return s;

      const qty = Math.abs(pos.qty);
      const proceeds = qty * px;
      let realized = 0;
      if (pos.qty > 0) realized = (px - pos.avg) * qty;
      else realized = (pos.avg - px) * qty;

      const res = realizeWinLoss(realized, s);

      const newCash = s.cash + proceeds;
      const eq = newCash;

      return {
        ...s,
        cash: newCash,
        position: null,
        bestEquity: Math.max(eq, s.bestEquity),
        wins: res.wins,
        losses: res.losses,
        streak: res.streak,
        trades: [
          ...s.trades,
          { ts: Date.now(), side: "SELL", price: px, qty, note: "Close position", eqAfter: eq },
        ],
      };
    });
  };

  const clearTrades = () => setState((s) => ({ ...s, trades: [] }));
  const resetAll = () =>
    setState({
      startCash: initialCash,
      cash: initialCash,
      position: null,
      trades: [],
      bestEquity: initialCash,
      wins: 0,
      losses: 0,
      streak: 0,
    });

  return { state, equityFromMark, buy, sell, closeAll, clearTrades, resetAll, setState };
}

/* =======================  UI ======================= */

const GoldFrame: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div
    style={{
      border: `2px solid ${bronze}`,
      borderRadius: 14,
      boxShadow: `0 0 0 1px ${bronzeGlow}, 0 10px 36px ${bronzeGlow}`,
      background: "linear-gradient(180deg, rgba(201,154,59,.07) 0%, rgba(0,0,0,.25) 100%)",
      padding: 10,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "6px 8px 10px",
      }}
    >
      <div
        style={{
          background: bronze,
          color: "#151515",
          fontWeight: 800,
          padding: "4px 12px",
          borderRadius: 999,
        }}
      >
        {title}
      </div>
    </div>
    <div style={{ borderRadius: 10, overflow: "hidden", background: boxBg }}>{children}</div>
  </div>
);

export default function VirtualTradingPage() {
  /* ----- controls ----- */
  const [symbol, setSymbol] = useState<string>(COMMON[0]);
  const [speed, setSpeed] = useState<{ name: string; bar: number }>({ name: "1 day / 1s", bar: 1000 });
  const [startDate, setStartDate] = useState(() => Date.UTC(2018, 0, 1));
  const [seed, setSeed] = useState(42);
  const [runNonce, setRunNonce] = useState(0);
  const [qty, setQty] = useState(0.1);
  const [allowShort, setAllowShort] = useState(false);

  /* ----- series ----- */
  const fullSeries = useMemo(() => {
    const px0 = symbol.includes("USD") ? 10000 : 1000;
    return makeSeededSeries(3000, seed, startDate, speed.bar, px0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, startDate, speed.bar, runNonce, seed]);

  // rolling window for the chart playback
  const [cursor, setCursor] = useState(400);
  useEffect(() => setCursor(400), [symbol, speed, startDate, runNonce]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCursor((c) => Math.min(c + 1, fullSeries.length - 1));
    }, speed.bar);
    return () => window.clearInterval(id);
  }, [fullSeries.length, speed.bar]);

  const viewSeries = useMemo(() => fullSeries.slice(Math.max(0, cursor - 380), cursor + 1), [fullSeries, cursor]);
  const mark = viewSeries.at(-1)?.c ?? 0;

  /* ----- game ----- */
  const { state, equityFromMark, buy, sell, closeAll, clearTrades, resetAll } = useGame(10000);

  /* ----- chart ----- */
  const priceRef = useRef<HTMLDivElement | null>(null);
  const priceChart = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const emaFastSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const emaSlowSeries = useRef<ISeriesApi<"Line"> | null>(null);

  // create once
  useEffect(() => {
    if (!priceRef.current) return;
    const pc = createChart(priceRef.current, {
      layout: { background: { color: panelBg }, textColor: textSoft },
      grid: { horzLines: { color: gridDark }, vertLines: { color: gridDark } },
      rightPriceScale: { borderColor: gridDark },
      timeScale: { borderColor: gridDark },
      crosshair: { mode: 1 },
      width: priceRef.current.clientWidth,
      height: 420,
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
    emaFastSeries.current = pc.addLineSeries({ lineWidth: 2, color: "#5ee7ff" });
    emaSlowSeries.current = pc.addLineSeries({ lineWidth: 2, color: "#a88dff" });

    // flicker-free resize
    let lastW = priceRef.current.clientWidth;
    let af: number | null = null;
    const ro = new ResizeObserver(() => {
      if (!priceChart.current || !priceRef.current) return;
      const w = priceRef.current.clientWidth;
      if (w === lastW) return;
      lastW = w;
      if (af) cancelAnimationFrame(af);
      af = requestAnimationFrame(() => {
        priceChart.current!.applyOptions({ width: w });
      });
    });
    ro.observe(priceRef.current);

    return () => {
      if (af) cancelAnimationFrame(af);
      ro.disconnect();
      priceChart.current?.remove();
      priceChart.current = null;
    };
  }, []);

  // update data when viewSeries changes
  useEffect(() => {
    if (!priceChart.current || !candleSeries.current) return;
    const data = viewSeries.map((b) => ({
      time: Math.floor(b.t / 1000) as UTCTimestamp,
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
    }));
    candleSeries.current.setData(data);

    // simple EMAs
    const closeArr = viewSeries.map((b) => b.c);
    const ema = (arr: number[], p: number) => {
      const k = 2 / (p + 1);
      let prev: number | null = null;
      return arr.map((x) => (prev = prev === null ? x : prev + k * (x - prev)));
    };
    const ema9 = ema(closeArr, 9);
    const ema21 = ema(closeArr, 21);
    const mkLine = (arr: number[]) =>
      arr.map((v, i) => ({ time: data[i].time, value: v })) as LineData[];

    emaFastSeries.current!.setData(mkLine(ema9));
    emaSlowSeries.current!.setData(mkLine(ema21));

    priceChart.current.timeScale().fitContent();
  }, [viewSeries]);

  /* ----- UI handlers ----- */
  const eq = equityFromMark(mark);
  const eqDelta = eq - state.startCash;
  const eqPct = (eqDelta / state.startCash) * 100;

  const canClose = !!state.position && state.position.qty !== 0;
  const canBuy = true; // always
  const canSell = allowShort ? true : (state.position?.qty ?? 0) > 0;

  const onBuy = () => buy(mark, clamp(+qty || 0.1, 0.01, 1000), "Game");
  const onSell = () => {
    const q = clamp(+qty || 0.1, 0.01, 1000);
    if (!allowShort && (!state.position || state.position.qty <= 0)) return;
    sell(mark, q, "Game");
  };

  return (
    <Layout title="Virtual Trading — Game (Time-Warp)" description="Dark golden game with quests and playback">
      <div style={{ maxWidth: "none", width: "100%", padding: "16px 2vw" }}>
        <GoldFrame title="VIRTUAL TRADING — GAME (Time-Warp)">
          {/* header controls */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr 260px",
              gap: 12,
              padding: 12,
              background: panelBg,
              borderBottom: `1px solid ${gridDark}`,
              color: textSoft,
            }}
          >
            {/* left: quests + quick actions */}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Quests</div>
              <div style={{ display: "grid", gap: 8, fontSize: 12 }}>
                <div>+2% equity</div>
                <div>+5% equity</div>
                <div>+10% equity</div>
              </div>

              <div style={{ height: 1, background: gridDark, margin: "8px 0" }} />

              <div style={{ display: "grid", gap: 8 }}>
                <button
                  onClick={() => closeAll(mark)}
                  style={{
                    background: "transparent",
                    color: bronze,
                    border: `1px solid ${bronze}`,
                    padding: "6px 10px",
                    borderRadius: 8,
                  }}
                >
                  Flat now
                </button>
                <button
                  onClick={clearTrades}
                  style={{
                    background: "transparent",
                    color: textSoft,
                    border: `1px solid ${gridDark}`,
                    padding: "6px 10px",
                    borderRadius: 8,
                  }}
                >
                  Clear trades
                </button>
                <button
                  onClick={resetAll}
                  style={{
                    background: "transparent",
                    color: textSoft,
                    border: `1px solid ${gridDark}`,
                    padding: "6px 10px",
                    borderRadius: 8,
                  }}
                >
                  Reset progress
                </button>
                <button
                  onClick={() => setRunNonce((n) => n + 1)}
                  style={{
                    background: "transparent",
                    color: textSoft,
                    border: `1px solid ${gridDark}`,
                    padding: "6px 10px",
                    borderRadius: 8,
                  }}
                >
                  Restart run
                </button>
              </div>
            </div>

            {/* middle: chart */}
            <div style={{ background: panelBg, border: `1px solid ${gridDark}`, borderRadius: 10, padding: 8 }}>
              <div
                ref={priceRef}
                style={{
                  width: "100%",
                  height: 420,
                  overflow: "hidden",
                  contain: "layout size style",
                  borderRadius: 8,
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <span style={{ opacity: 0.7, fontSize: 12 }}>Qty</span>
                <input
                  className="num"
                  value={qty}
                  onChange={(e) => setQty(parseFloat(e.target.value))}
                  type="number"
                  min={0.01}
                  step={0.01}
                  style={{
                    width: 80,
                    background: "#0b1320",
                    color: textSoft,
                    border: `1px solid ${gridDark}`,
                    borderRadius: 6,
                    padding: "6px 8px",
                  }}
                />
                <button
                  onClick={onBuy}
                  disabled={!canBuy}
                  style={{
                    background: "#1c3f2f",
                    color: "#b9ffde",
                    border: "1px solid #2a6b4f",
                    padding: "6px 10px",
                    borderRadius: 8,
                  }}
                >
                  Buy @ {mark.toFixed(2)}
                </button>
                <button
                  onClick={onSell}
                  disabled={!canSell}
                  style={{
                    background: canSell ? "#4b1f24" : "#2a1a1d",
                    color: canSell ? "#ffd6db" : "#6f5c5f",
                    border: "1px solid #7a2a33",
                    padding: "6px 10px",
                    borderRadius: 8,
                  }}
                >
                  Sell @ {mark.toFixed(2)}
                </button>
                <button
                  onClick={() => canClose && closeAll(mark)}
                  disabled={!canClose}
                  style={{
                    background: "#2a2a2a",
                    color: "#ddd",
                    border: "1px solid #444",
                    padding: "6px 10px",
                    borderRadius: 8,
                  }}
                >
                  Close Position
                </button>
                <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
                  <label style={{ fontSize: 12, opacity: 0.8 }}>Shorting</label>
                  <input
                    type="checkbox"
                    checked={allowShort}
                    onChange={(e) => setAllowShort(e.target.checked)}
                  />
                </div>
              </div>
            </div>

            {/* right: account */}
            <div
              style={{
                background: panelBg,
                border: `1px solid ${gridDark}`,
                borderRadius: 10,
                padding: 12,
                color: textSoft,
                display: "grid",
                gap: 6,
                alignContent: "start",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Account</div>
              <div>Cash: <b>{state.cash.toFixed(2)}</b></div>
              <div>
                Pos:{" "}
                <b>
                  {state.position ? `${state.position.qty.toFixed(2)} @ ${state.position.avg.toFixed(2)}` : "—"}
                </b>
              </div>
              <div>Equity: <b>{eq.toFixed(2)}</b> <span style={{ color: eqDelta >= 0 ? "#21e087" : "#ff6b6b" }}>
                ({eqDelta >= 0 ? "+" : ""}{eqDelta.toFixed(2)} / {eqPct.toFixed(2)}%)
              </span></div>
              <div>Wins: {state.wins} &nbsp; Losses: {state.losses} &nbsp; Streak: {state.streak}</div>

              <div style={{ height: 1, background: gridDark, margin: "8px 0" }} />

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 12, opacity: 0.75 }}>Start</label>
                <input
                  type="date"
                  value={new Date(startDate).toISOString().slice(0, 10)}
                  onChange={(e) => setStartDate(Date.parse(e.target.value))}
                  style={{
                    background: "#0b1320",
                    color: textSoft,
                    border: `1px solid ${gridDark}`,
                    borderRadius: 6,
                    padding: "6px 8px",
                  }}
                />
                <label style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>Speed</label>
                <select
                  value={speed.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSpeed(
                      v === "1 day / 1s"
                        ? { name: v, bar: 1000 }
                        : v === "1 day / 500ms"
                        ? { name: v, bar: 500 }
                        : { name: v, bar: 200 }
                    );
                  }}
                  style={{
                    background: "#0b1320",
                    color: textSoft,
                    border: `1px solid ${gridDark}`,
                    borderRadius: 6,
                    padding: "6px 8px",
                  }}
                >
                  <option>1 day / 1s</option>
                  <option>1 day / 500ms</option>
                  <option>1 day / 200ms</option>
                </select>
                <label style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>Symbol</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  style={{
                    background: "#0b1320",
                    color: textSoft,
                    border: `1px solid ${gridDark}`,
                    borderRadius: 6,
                    padding: "6px 8px",
                  }}
                >
                  {COMMON.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>

                <label style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>Seed</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value || "42", 10))}
                  style={{
                    background: "#0b1320",
                    color: textSoft,
                    border: `1px solid ${gridDark}`,
                    borderRadius: 6,
                    padding: "6px 8px",
                  }}
                />
              </div>
            </div>
          </div>

          {/* trades */}
          <div
            style={{
              background: panelBg,
              borderTop: `1px solid ${gridDark}`,
              color: textSoft,
              padding: 12,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Signals</div>
            <div
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 12,
                display: "grid",
                gap: 6,
                maxHeight: 260,
                overflow: "auto",
              }}
            >
              {state.trades
                .slice()
                .reverse()
                .map((t, i) => (
                  <div key={i} style={{ opacity: 0.95 }}>
                    {new Date(t.ts).toLocaleString()} &nbsp;
                    <b style={{ color: t.side === "BUY" ? "#21e087" : "#ff6b6b" }}>{t.side}</b> &nbsp;
                    {symbol} @ {t.price.toFixed(2)} (qty {t.qty}) — Eq {t.eqAfter.toFixed(2)}
                    {t.note ? ` — ${t.note}` : ""}
                  </div>
                ))}
              {state.trades.length === 0 && <div style={{ opacity: 0.7 }}>No trades yet.</div>}
            </div>
          </div>
        </GoldFrame>
      </div>
    </Layout>
  );
}
