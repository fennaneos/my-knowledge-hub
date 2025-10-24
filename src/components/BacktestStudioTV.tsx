// src/components/BacktestStudioTV.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import HelpTip from "./HelpTip";

import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  UTCTimestamp,
  IPriceLine,
} from "lightweight-charts";

/* ===============================
   DATA TYPES
   =============================== */
type Bar = { t: number; o: number; h: number; l: number; c: number };
type Series = Bar[];
type StratKind = "EMA Cross" | "RSI";

type RunParams = {
  symbol: string;
  kind: StratKind;
  fee: number;
  slippage: number;
  riskFree: number;
  emaFast: number;
  emaSlow: number;
  rsiPeriod: number;
  rsiBuy: number;
  rsiSell: number;
};

type Trade = { time: number; side: "BUY" | "SELL"; price: number; qty: number };
type Result = {
  equity: number[];
  times: number[];
  trades: Trade[];
  markers: { time: number; price: number; side: "BUY" | "SELL" }[];
  emaFast?: number[];
  emaSlow?: number[];
  rsi?: number[];
  metrics: {
    cagr: number;
    sharpe: number;
    vol: number;
    maxdd: number;
    winRate: number;
    nTrades: number;
  };
};

/* ===============================
   UTILS
   =============================== */
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

function rsiArr(src: number[], period: number): number[] {
  const out = new Array(src.length).fill(NaN);
  if (src.length < period + 1) return out;
  let gains = 0,
    losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = src[i] - src[i - 1];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  let avgG = gains / period,
    avgL = losses / period;
  out[period] = 100 - 100 / (1 + (avgL === 0 ? Infinity : avgG / avgL));
  for (let i = period + 1; i < src.length; i++) {
    const d = src[i] - src[i - 1];
    const g = Math.max(0, d),
      l = Math.max(0, -d);
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
    out[i] = 100 - 100 / (1 + (avgL === 0 ? Infinity : avgG / avgL));
  }
  return out;
}

function maxDrawdown(eq: number[]) {
  let peak = eq[0],
    m = 0;
  for (const v of eq) {
    peak = Math.max(peak, v);
    m = Math.max(m, (peak - v) / peak);
  }
  return m;
}

function annStats(eq: number[], times: number[], rfAnnual: number) {
  if (eq.length < 2) return { sharpe: 0, vol: 0, cagr: 0 };
  const rets: number[] = [];
  let days = 0;
  for (let i = 1; i < eq.length; i++) {
    rets.push(Math.log(eq[i] / eq[i - 1]));
    days += (times[i] - times[i - 1]) / 86400000;
  }
  const mu = rets.reduce((a, b) => a + b, 0) / rets.length;
  const varr = rets.reduce((a, b) => a + (b - mu) ** 2, 0) / Math.max(1, rets.length);
  const sd = Math.sqrt(varr);
  const vol = sd * Math.sqrt(252);
  const ann = mu * 252;
  const sharpe = vol > 0 ? (ann - rfAnnual) / vol : 0;
  const years = days / 365;
  const cagr = years > 0 ? Math.pow(eq[eq.length - 1] / eq[0], 1 / years) - 1 : 0;
  return { sharpe, vol, cagr };
}

/* -------- Demo GBM -------- */
function gbmClose(n: number, mu = 0.12, sigma = 0.25, start = 100) {
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
    const h = Math.max(o, c) * (1 + Math.random() * 0.003);
    const l = Math.min(o, c) * (1 - Math.random() * 0.003);
    res.push({ t: start + i * 86400000, o, h, l, c });
  }
  return res;
}

/* -------- CSV -------- */
function parseCSV(text: string): Series {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const head = lines[0].toLowerCase().split(",").map((s) => s.trim());
  const idx = {
    d: head.indexOf("date"),
    o: head.indexOf("open"),
    h: head.indexOf("high"),
    l: head.indexOf("low"),
    c: head.indexOf("close"),
  };
  const out: Series = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((s) => s.trim());
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

/* -------- Backtest (long/flat) -------- */
function runBacktest(bars: Series, p: RunParams): Result {
  const c = bars.map((b) => b.c);
  const t = bars.map((b) => b.t);
  const times = t;
  let long = false,
    pos = 0,
    cash = 1,
    last = c[0];
  const equity = [cash];
  const trades: Trade[] = [];
  const markers: Result["markers"] = [];

  const emaF = emaArr(c, p.emaFast);
  const emaS = emaArr(c, p.emaSlow);
  const rsiV = rsiArr(c, p.rsiPeriod);

  for (let i = 1; i < bars.length; i++) {
    const price = c[i];
    let buy = false,
      sell = false;

    if (p.kind === "EMA Cross") {
      if (
        isFinite(emaF[i]) &&
        isFinite(emaS[i]) &&
        isFinite(emaF[i - 1]) &&
        isFinite(emaS[i - 1])
      ) {
        const prevDiff = emaF[i - 1] - emaS[i - 1];
        const diff = emaF[i] - emaS[i];
        if (prevDiff <= 0 && diff > 0) buy = true;
        if (prevDiff >= 0 && diff < 0) sell = true;
      }
    } else {
      const r0 = rsiV[i - 1],
        r1 = rsiV[i];
      if (isFinite(r0) && isFinite(r1)) {
        if (r0 < p.rsiBuy && r1 >= p.rsiBuy) buy = true;
        if (r0 > p.rsiSell && r1 <= p.rsiSell) sell = true;
      }
    }

    if (!long && buy) {
      long = true;
      pos = 1;
      const fill = price * (1 + p.slippage);
      cash = (cash * (1 - p.fee)) / (price / fill);
      trades.push({ time: times[i], side: "BUY", price: fill, qty: 1 });
      markers.push({ time: times[i], price: bars[i].c, side: "BUY" });
    } else if (long && sell) {
      long = false;
      pos = 0;
      const fill = price * (1 - p.slippage);
      cash = cash * (fill / price) * (1 - p.fee);
      trades.push({ time: times[i], side: "SELL", price: fill, qty: 1 });
      markers.push({ time: times[i], price: bars[i].c, side: "SELL" });
    }

    if (pos === 1) cash *= price / last;
    equity.push(cash);
    last = price;
  }

  const { sharpe, vol, cagr } = annStats(equity, times, p.riskFree);
  const maxdd = maxDrawdown(equity);
  const sells = trades.filter((ti) => ti.side === "SELL").length;
  const wins = Math.max(0, sells - Math.floor(trades.length / 2));
  const winRate = trades.length ? wins / Math.max(1, trades.length / 2) : 0;

  return {
    equity,
    times,
    trades,
    markers,
    emaFast: emaF,
    emaSlow: emaS,
    rsi: rsiV,
    metrics: { cagr, sharpe, vol, maxdd, winRate, nTrades: trades.length },
  };
}

/* ===============================
   MAIN COMPONENT
   =============================== */
export default function BacktestStudioTV() {
  // ---------- data ----------
  const [bars, setBars] = useState<Series>(() => toCandlesFromClose(gbmClose(300)));
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

  // ---------- TV charts (price + rsi + equity) ----------
  const priceRef = useRef<HTMLDivElement | null>(null);
  const rsiRef = useRef<HTMLDivElement | null>(null);
  const equityRef = useRef<HTMLDivElement | null>(null);

  const priceChart = useRef<IChartApi | null>(null);
  const rsiChart = useRef<IChartApi | null>(null);
  const equityChart = useRef<IChartApi | null>(null);

  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const emaFastSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const emaSlowSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const equitySeries = useRef<ISeriesApi<"Line"> | null>(null);

  // horizontal price lines (refs so we can update/cleanup)
  const lastPriceLine = useRef<IPriceLine | null>(null);
  const rsi30Line = useRef<IPriceLine | null>(null);
  const rsi70Line = useRef<IPriceLine | null>(null);
  const eqBaselineLine = useRef<IPriceLine | null>(null);

  // vertical guidelines (crosshair) + legends
  const vlinePrice = useRef<HTMLDivElement | null>(null);
  const vlineRsi = useRef<HTMLDivElement | null>(null);
  const vlineEq = useRef<HTMLDivElement | null>(null);

  const priceLegend = useRef<HTMLDivElement | null>(null);
  const rsiLegend = useRef<HTMLDivElement | null>(null);
  const eqLegend = useRef<HTMLDivElement | null>(null);

  // vertical event lines (BUY/SELL)
  const eventLinesPrice = useRef<HTMLDivElement[]>([]);
  const eventLinesRsi = useRef<HTMLDivElement[]>([]);
  const eventLinesEq = useRef<HTMLDivElement[]>([]);

  // readiness flags for safe range sync
  const priceReady = useRef(false);
  const rsiReady = useRef(false);
  const eqReady = useRef(false);

  // helpers to create overlays
  function mkLegend(container: HTMLElement, text: string) {
    const d = document.createElement("div");
    d.style.position = "absolute";
    d.style.right = "8px";
    d.style.top = "6px";
    d.style.font = "12px ui-monospace, monospace";
    d.style.background = "rgba(10,20,40,.6)";
    d.style.padding = "6px 8px";
    d.style.border = "1px solid rgba(100,160,255,.25)";
    d.style.borderRadius = "8px";
    d.style.pointerEvents = "none";
    d.innerHTML = text;
    container.appendChild(d);
    return d;
  }
  function mkVline(container: HTMLElement, color = "rgba(120,200,255,.45)") {
    const v = document.createElement("div");
    v.style.position = "absolute";
    v.style.top = "0";
    v.style.bottom = "0";
    v.style.width = "1px";
    v.style.background = color;
    v.style.pointerEvents = "none";
    v.style.transform = "translateX(-0.5px)";
    v.style.display = "none";
    container.appendChild(v);
    return v;
  }
  function mkEventLine(container: HTMLElement, color: string) {
    const v = document.createElement("div");
    v.style.position = "absolute";
    v.style.top = "0";
    v.style.bottom = "0";
    v.style.width = "1px";
    v.style.background = color;
    v.style.pointerEvents = "none";
    container.appendChild(v);
    return v;
  }
  function clearEventLines() {
    for (const el of eventLinesPrice.current) el.remove();
    for (const el of eventLinesRsi.current) el.remove();
    for (const el of eventLinesEq.current) el.remove();
    eventLinesPrice.current = [];
    eventLinesRsi.current = [];
    eventLinesEq.current = [];
  }

  // (A) init charts once
  useEffect(() => {
    if (!priceRef.current || !rsiRef.current || !equityRef.current) return;
    if (typeof window === "undefined") return;

    // price
    const pc = createChart(priceRef.current, {
      layout: { background: { color: "#0b1320" }, textColor: "#d2e6ff" },
      grid: { horzLines: { color: "#11243b" }, vertLines: { color: "#11243b" } },
      rightPriceScale: { borderColor: "#1d3559" },
      timeScale: { borderColor: "#1d3559" },
      crosshair: { mode: 1 },
      width: priceRef.current.clientWidth,
      height: 320,
    });
    priceChart.current = pc;
    const cs = pc.addCandlestickSeries({
      upColor: "#21e087",
      downColor: "#ff6b6b",
      borderUpColor: "#21e087",
      borderDownColor: "#ff6b6b",
      wickUpColor: "#21e087",
      wickDownColor: "#ff6b6b",
    });
    candleSeries.current = cs;
    emaFastSeries.current = pc.addLineSeries({ lineWidth: 2, color: "#48fffb" });
    emaSlowSeries.current = pc.addLineSeries({ lineWidth: 2, color: "#a472ff" });

    // rsi
    const rc = createChart(rsiRef.current, {
      layout: { background: { color: "#0b1320" }, textColor: "#d2e6ff" },
      grid: { horzLines: { color: "#10233a" }, vertLines: { color: "#10233a" } },
      rightPriceScale: { borderColor: "#1d3559" },
      timeScale: { borderColor: "#1d3559" },
      width: rsiRef.current.clientWidth,
      height: 140,
    });
    rsiChart.current = rc;
    rsiSeries.current = rc.addLineSeries({ lineWidth: 2, color: "#ffd166" });

    // equity
    const ec = createChart(equityRef.current, {
      layout: { background: { color: "#0b1320" }, textColor: "#d2e6ff" },
      grid: { horzLines: { color: "#10233a" }, vertLines: { color: "#10233a" } },
      rightPriceScale: { borderColor: "#1d3559" },
      timeScale: { borderColor: "#1d3559" },
      width: equityRef.current.clientWidth,
      height: 160,
    });
    equityChart.current = ec;
    equitySeries.current = ec.addLineSeries({ lineWidth: 2, color: "#3ecbff" });

    // legends
    priceLegend.current = mkLegend(
      priceRef.current,
      `Price: <b>-</b> • EMA12: <b>-</b> • EMA26: <b>-</b>`
    );
    rsiLegend.current = mkLegend(rsiRef.current, `RSI: <b>-</b>  (30–70 band)`);
    eqLegend.current = mkLegend(equityRef.current, `Equity: <b>-</b>`);

    // crosshair vlines
    vlinePrice.current = mkVline(priceRef.current);
    vlineRsi.current = mkVline(rsiRef.current);
    vlineEq.current = mkVline(equityRef.current);

    // visible range sync (guarded; fixes “Value is null”)
    pc.timeScale().subscribeVisibleTimeRangeChange((range) => {
      try {
        if (!range || (range as any).from == null || (range as any).to == null) return;
        if (rsiReady.current && rsiChart.current) {
          const ts = rsiChart.current.timeScale?.();
          // @ts-ignore
          if (ts?.setVisibleRange) ts.setVisibleRange(range);
        }
        if (eqReady.current && equityChart.current) {
          const ts = equityChart.current.timeScale?.();
          // @ts-ignore
          if (ts?.setVisibleRange) ts.setVisibleRange(range);
        }
        // redraw event lines to follow zoom/pan
        drawEventVLines();
      } catch {}
    });

    // crosshair move → vlines + legends
    const onMove = (p) => {
      if (!p || !p.point) {
        [vlinePrice.current, vlineRsi.current, vlineEq.current].forEach((el) => {
          if (el) el.style.display = "none";
        });
        return;
      }
      const x = p.point.x;
      [vlinePrice.current, vlineRsi.current, vlineEq.current].forEach((el) => {
        if (el) {
          el.style.display = "block";
          el.style.left = `${x}px`;
        }
      });

      // legends
      if (priceLegend.current) {
        const priceVal =
          (p.seriesPrices && candleSeries.current ? p.seriesPrices.get?.(candleSeries.current) : undefined) ??
          p.seriesPrices?.[candleSeries.current as any];
        const ema12 =
          (p.seriesPrices && emaFastSeries.current ? p.seriesPrices.get?.(emaFastSeries.current) : undefined) ??
          p.seriesPrices?.[emaFastSeries.current as any];
        const ema26 =
          (p.seriesPrices && emaSlowSeries.current ? p.seriesPrices.get?.(emaSlowSeries.current) : undefined) ??
          p.seriesPrices?.[emaSlowSeries.current as any];

        const fmt = (v: any) => (Number.isFinite(v) ? (+v).toFixed(2) : "-");
        priceLegend.current.innerHTML = `Price: <b>${fmt(priceVal)}</b> • EMA12: <b>${fmt(
          ema12
        )}</b> • EMA26: <b>${fmt(ema26)}</b>`;
      }
      if (rsiLegend.current) {
        const rsv =
          (p.seriesPrices && rsiSeries.current ? p.seriesPrices.get?.(rsiSeries.current) : undefined) ??
          p.seriesPrices?.[rsiSeries.current as any];
        const fmt = (v: any) => (Number.isFinite(v) ? (+v).toFixed(2) : "-");
        rsiLegend.current.innerHTML = `RSI: <b>${fmt(rsv)}</b>  (30–70 band)`;
      }
      if (eqLegend.current) {
        const eqs =
          (p.seriesPrices && equitySeries.current ? p.seriesPrices.get?.(equitySeries.current) : undefined) ??
          p.seriesPrices?.[equitySeries.current as any];
        const fmt = (v: any) => (Number.isFinite(v) ? (+v).toFixed(4) : "-");
        eqLegend.current.innerHTML = `Equity: <b>${fmt(eqs)}</b>`;
      }
    };
    pc.subscribeCrosshairMove(onMove);

    // resizing
    const onResize = () => {
      if (priceChart.current && priceRef.current)
        priceChart.current.applyOptions({ width: priceRef.current.clientWidth });
      if (rsiChart.current && rsiRef.current)
        rsiChart.current.applyOptions({ width: rsiRef.current.clientWidth });
      if (equityChart.current && equityRef.current)
        equityChart.current.applyOptions({ width: equityRef.current.clientWidth });
      drawEventVLines();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(priceRef.current);
    ro.observe(rsiRef.current);
    ro.observe(equityRef.current);

    return () => {
      ro.disconnect();
      pc.unsubscribeCrosshairMove(onMove);

      priceReady.current = false;
      rsiReady.current = false;
      eqReady.current = false;

      priceLegend.current?.remove();
      rsiLegend.current?.remove();
      eqLegend.current?.remove();
      vlinePrice.current?.remove();
      vlineRsi.current?.remove();
      vlineEq.current?.remove();
      clearEventLines();

      priceLegend.current = null;
      rsiLegend.current = null;
      eqLegend.current = null;
      vlinePrice.current = null;
      vlineRsi.current = null;
      vlineEq.current = null;

      equityChart.current?.remove();
      rsiChart.current?.remove();
      priceChart.current?.remove();

      equityChart.current = null;
      rsiChart.current = null;
      priceChart.current = null;

      candleSeries.current = null;
      emaFastSeries.current = null;
      emaSlowSeries.current = null;
      rsiSeries.current = null;
      equitySeries.current = null;

      // remove price lines
      lastPriceLine.current = null;
      rsi30Line.current = null;
      rsi70Line.current = null;
      eqBaselineLine.current = null;
    };
  }, []);

  // (B) set data + horizontal lines + event lines
  useEffect(() => {
    if (!priceChart.current || !candleSeries.current) return;

    // candles
    const candle = bars.map((b) => ({
      time: Math.floor(b.t / 1000) as UTCTimestamp,
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
    }));
    candleSeries.current.setData(candle);
    priceReady.current = true;

    // EMAs
    if (result.emaFast && emaFastSeries.current) {
      const lf = result.emaFast.map((y, i) => ({ time: candle[i].time, value: y })) as LineData[];
      emaFastSeries.current.setData(lf);
    }
    if (result.emaSlow && emaSlowSeries.current) {
      const ls = result.emaSlow.map((y, i) => ({ time: candle[i].time, value: y })) as LineData[];
      emaSlowSeries.current.setData(ls);
    }

    // Buy/Sell markers (small arrows)
    candleSeries.current.setMarkers(
      result.markers.map((m) => ({
        time: Math.floor(m.time / 1000) as UTCTimestamp,
        position: m.side === "BUY" ? "belowBar" : "aboveBar",
        color: m.side === "BUY" ? "#21e087" : "#ff6b6b",
        shape: m.side === "BUY" ? "arrowUp" : "arrowDown",
        text: m.side === "BUY" ? "Buy" : "Sell",
      }))
    );

    // Horizontal price lines
    // Last price line on price chart
    const lastClose = bars.at(-1)?.c;
    if (Number.isFinite(lastClose) && candleSeries.current) {
      // remove old if any
      if (lastPriceLine.current) {
        candleSeries.current.removePriceLine(lastPriceLine.current);
      }
      lastPriceLine.current = candleSeries.current.createPriceLine({
        price: lastClose!,
        color: "rgba(110,200,255,.65)",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "Last",
      });
    }

    // RSI lines 30/70
    if (rsiSeries.current) {
      if (rsi30Line.current) rsiSeries.current.removePriceLine(rsi30Line.current);
      if (rsi70Line.current) rsiSeries.current.removePriceLine(rsi70Line.current);
      rsi30Line.current = rsiSeries.current.createPriceLine({
        price: 30,
        color: "rgba(140,200,255,.55)",
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: true,
        title: "30",
      });
      rsi70Line.current = rsiSeries.current.createPriceLine({
        price: 70,
        color: "rgba(140,200,255,.55)",
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: true,
        title: "70",
      });
    }

    // RSI data
    if (rsiSeries.current && result.rsi?.length) {
      const rs = result.rsi.map((v, i) => ({
        time: candle[i].time,
        value: Number.isFinite(v) ? v : NaN,
      })) as LineData[];
      rsiSeries.current.setData(rs);
      rsiReady.current = true;
    }

    // Equity + baseline
    if (equitySeries.current && result.equity.length) {
      const eq = result.equity.map((v, i) => ({
        time: Math.floor(result.times[i] / 1000) as UTCTimestamp,
        value: v,
      })) as LineData[];
      equitySeries.current.setData(eq);
      eqReady.current = true;

      // 1.00 baseline
      if (eqBaselineLine.current) {
        equitySeries.current.removePriceLine(eqBaselineLine.current);
      }
      eqBaselineLine.current = equitySeries.current.createPriceLine({
        price: 1.0,
        color: "rgba(120,255,170,.55)",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "1.00",
      });

      equityChart.current?.timeScale().fitContent();
    }

    priceChart.current.timeScale().fitContent();
    rsiChart.current?.timeScale().fitContent();

    // draw vertical event lines at buy/sell times
    drawEventVLines();
  }, [bars, result]);

  // compute & draw persistent vertical lines at trade times on all charts
  function drawEventVLines() {
    if (!priceChart.current || !priceRef.current || !rsiRef.current || !equityRef.current) return;
    if (!result || !result.trades?.length) {
      clearEventLines();
      return;
    }

    const ts = priceChart.current.timeScale();
    if (!ts || !("timeToCoordinate" in ts)) return;

    // clear existing
    clearEventLines();

    const timesUniq = Array.from(new Set(result.trades.map((t) => t.time)));
    for (const t of timesUniq) {
      const x = (ts as any).timeToCoordinate(Math.floor(t / 1000) as UTCTimestamp);
      if (x == null) continue;

      // pick color by side at that time (if any buy -> green, else red)
      const atTime = result.trades.filter((tr) => tr.time === t);
      const hasBuy = atTime.some((a) => a.side === "BUY");
      const color = hasBuy ? "rgba(33,224,135,.45)" : "rgba(255,107,107,.45)";

      const p = mkEventLine(priceRef.current!, color);
      const r = mkEventLine(rsiRef.current!, color);
      const e = mkEventLine(equityRef.current!, color);

      p.style.left = `${x}px`;
      r.style.left = `${x}px`;
      e.style.left = `${x}px`;

      eventLinesPrice.current.push(p);
      eventLinesRsi.current.push(r);
      eventLinesEq.current.push(e);
    }
  }

  // ---------- CSV upload ----------
  const onCSV = async (file: File) => {
    const text = await file.text();
    const s = parseCSV(text);
    if (s.length) {
      setBars(s);
      setP((pp) => ({ ...pp, symbol: file.name.replace(/\.\w+$/, "").toUpperCase() }));
    } else {
      alert("Could not parse CSV. Expect columns: date,open,high,low,close");
    }
  };

  const fmtPct = (x: number) => (x * 100).toFixed(2) + "%";
  const fmt2 = (x: number) => x.toFixed(2);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) min(320px, 28vw)",
        gap: 14,
        alignItems: "start",
      }}
    >
      {/* LEFT: charts */}
      <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
        <div className="panel" style={{ padding: 14 }}>
          <div
            className="panelHeader"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
              <span>Backtest Studio</span>
              <span className="lux-chip">{p.symbol}</span>
              <HelpTip title="What do the lines mean?">
                <div style={{ maxWidth: 300 }}>
                  <b>Vertical colored lines</b> mark <b>Buy</b> (green) and <b>Sell</b> (red) event timestamps across
                  all charts.<br />
                  <b>Horizontal lines</b>: “Last” on price, <b>30/70</b> on RSI, and <b>1.00</b> on equity baseline.
                </div>
              </HelpTip>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <label className="btn-ghost-blue" style={{ cursor: "pointer" }}>
                Upload CSV
                <HelpTip title="CSV format">
                  First row must contain headers: <code>date,open,high,low,close</code>. Dates like{" "}
                  <code>YYYY-MM-DD</code> or ISO are fine.
                </HelpTip>
                <input
                  type="file"
                  accept=".csv"
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files && onCSV(e.target.files[0])}
                />
              </label>
              <a className="btn-neo-red-modern" href="/pricing-labs">
                Get Pro
              </a>
            </div>
          </div>
          <div ref={priceRef} style={{ position: "relative", width: "100%", height: 320 }} />
        </div>

        <div className="panel" style={{ padding: 14 }}>
          <div className="panelHeader" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            RSI
            <HelpTip title="RSI (30–70)">
              We draw the <b>30</b> and <b>70</b> lines as horizontal guides (oversold/overbought). Vertical event
              lines align with Buy/Sell times above.
            </HelpTip>
          </div>
          <div ref={rsiRef} style={{ position: "relative", width: "100%", height: 140 }} />
        </div>

        <div className="panel" style={{ padding: 14 }}>
          <div className="panelHeader" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Equity Curve
            <HelpTip title="Baseline">
              We draw a horizontal <b>1.00</b> baseline to quickly see if the strategy is above (profit) or below
              (loss) initial capital.
            </HelpTip>
          </div>
          <div ref={equityRef} style={{ position: "relative", width: "100%", height: 160 }} />
        </div>

        <div className="panel" style={{ padding: 14 }}>
          <div className="panelHeader" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Trade Tape
            <HelpTip title="Market tape">
              Buy/Sell fills with timestamps and prices. Vertical event lines are drawn from these fills.
            </HelpTip>
          </div>

          <div className="panelBody" style={{ display: "grid", gap: 6 }}>
            {result.trades.length === 0 && <div style={{ opacity: 0.7 }}>No trades yet (adjust parameters).</div>}
            {result.trades
              .slice(-12)
              .reverse()
              .map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "150px 60px 1fr",
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 13,
                    gap: 8,
                  }}
                >
                  <div style={{ opacity: 0.7 }}>{new Date(t.time).toLocaleDateString()}</div>
                  <div style={{ color: t.side === "BUY" ? "#21e087" : "#ff6b6b", fontWeight: 800 }}>{t.side}</div>
                  <div>Price {fmt2(t.price)}</div>
                </div>
              ))}
          </div>
        </div>

        {/* INSIGHTS */}
        <div className="panel" style={{ padding: 20 }}>
          <div className="panelHeader" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Mathematical Insight
          </div>

          <div className="panelBody" style={{ fontSize: "15px", lineHeight: "1.6", color: "#cfe6ff" }}>
            <p>
              The <b>Exponential Moving Average (EMA)</b> smooths price while emphasizing recent data:
            </p>
            <BlockMath math={String.raw`EMA_t=\alpha P_t+(1-\alpha)EMA_{t-1},\quad \alpha=\frac{2}{N+1}`} />

            <p>
              A <b>Buy</b> when the fast EMA crosses above the slow EMA, a <b>Sell</b> on the opposite cross. We mark
              those times with vertical event lines.
            </p>

            <p>
              The <b>RSI</b> (Relative Strength Index) quantifies momentum on a 0–100 scale, with 30–70 considered
              neutral:
            </p>
            <BlockMath math={String.raw`RSI=100-\frac{100}{1+RS},\quad RS=\frac{\text{Avg Gain}_N}{\text{Avg Loss}_N}`} />
          </div>
        </div>

        <div className="panel" style={{ padding: 24, marginTop: 16 }}>
          <div
            className="panelHeader"
            style={{ fontSize: "1.3rem", fontWeight: 700, color: "#73c0ff", marginBottom: 12 }}
          >
            Quantitative Explanation
          </div>

          <p>
            <b>Signals:</b>
          </p>
          <BlockMath math={String.raw`\text{Buy if } EMA_{\text{fast}}>EMA_{\text{slow}},\quad \text{Sell if } EMA_{\text{fast}}<EMA_{\text{slow}}`} />

          <p>
            <b>Expected value</b> and <b>Sharpe ratio</b> frame quality:
          </p>
          <BlockMath math={String.raw`\mathbb{E}[R]=p_{\text{win}}\cdot\bar r_{\text{win}}-(1-p_{\text{win}})\cdot\bar r_{\text{loss}}`} />
          <BlockMath math={String.raw`\text{Sharpe}=\frac{\mathbb{E}[R-R_f]}{\sigma_R}`} />
        </div>
      </div>

      {/* RIGHT: controls + metrics (never overflow) */}
      <div style={{ display: "grid", gap: 12, alignContent: "start", width: "100%", maxWidth: 320 }}>
        <div className="panel" style={{ padding: 14 }}>
          <div className="panelHeader" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            Strategy
            <HelpTip title="Strategy type">
              <b>EMA Cross:</b> Buy when fast EMA crosses above slow; sell on the opposite cross. <br />
              <b>RSI:</b> Buy when RSI crosses up through Buy ≤; sell when it crosses down through Sell ≥.
            </HelpTip>
          </div>
          <div className="panelBody" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className={p.kind === "EMA Cross" ? "btn-neo-blue" : "btn-ghost-blue"}
                onClick={() => setP({ ...p, kind: "EMA Cross" })}
              >
                EMA Cross
              </button>
              <button
                className={p.kind === "RSI" ? "btn-neo-blue" : "btn-ghost-blue"}
                onClick={() => setP({ ...p, kind: "RSI" })}
              >
                RSI
              </button>
            </div>

            {p.kind === "EMA Cross" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>EMA Fast</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      className="num"
                      type="number"
                      min={2}
                      max={200}
                      value={p.emaFast}
                      onChange={(e) =>
                        setP({ ...p, emaFast: clamp(parseInt(e.target.value || "1"), 2, 200) })
                      }
                      style={{ width: "100%" }}
                    />
                    <HelpTip title="EMA Fast">Shorter lookback. More responsive, more noise.</HelpTip>
                  </div>
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>EMA Slow</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      className="num"
                      type="number"
                      min={3}
                      max={300}
                      value={p.emaSlow}
                      onChange={(e) =>
                        setP({ ...p, emaSlow: clamp(parseInt(e.target.value || "1"), 3, 300) })
                      }
                      style={{ width: "100%" }}
                    />
                    <HelpTip title="EMA Slow">Longer lookback. Smoother trend baseline.</HelpTip>
                  </div>
                </label>
              </div>
            )}

            {p.kind === "RSI" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>RSI Period</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      className="num"
                      type="number"
                      min={2}
                      max={100}
                      value={p.rsiPeriod}
                      onChange={(e) =>
                        setP({ ...p, rsiPeriod: clamp(parseInt(e.target.value || "1"), 2, 100) })
                      }
                      style={{ width: "100%" }}
                    />
                    <HelpTip title="RSI Period">Lower = more sensitive, higher = smoother.</HelpTip>
                  </div>
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>Buy ≤</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      className="num"
                      type="number"
                      min={1}
                      max={99}
                      value={p.rsiBuy}
                      onChange={(e) =>
                        setP({ ...p, rsiBuy: clamp(parseInt(e.target.value || "1"), 1, 99) })
                      }
                      style={{ width: "100%" }}
                    />
                    <HelpTip title="RSI Buy threshold">Classic oversold reversion: 30–35.</HelpTip>
                  </div>
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>Sell ≥</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      className="num"
                      type="number"
                      min={1}
                      max={99}
                      value={p.rsiSell}
                      onChange={(e) =>
                        setP({ ...p, rsiSell: clamp(parseInt(e.target.value || "1"), 1, 99) })
                      }
                      style={{ width: "100%" }}
                    />
                    <HelpTip title="RSI Sell threshold">Classic overbought exit: 65–70.</HelpTip>
                  </div>
                </label>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              <label style={{ display: "grid", gap: 4 }}>
                <span>Fee (fraction)</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    className="num"
                    type="number"
                    step="0.0001"
                    value={p.fee}
                    onChange={(e) => setP({ ...p, fee: parseFloat(e.target.value || "0") })}
                    style={{ width: "100%" }}
                  />
                  <HelpTip title="Fees">e.g. 0.0005 = 5 bps</HelpTip>
                </div>
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span>Slippage</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    className="num"
                    type="number"
                    step="0.0001"
                    value={p.slippage}
                    onChange={(e) => setP({ ...p, slippage: parseFloat(e.target.value || "0") })}
                    style={{ width: "100%" }}
                  />
                  <HelpTip title="Slippage">Execution penalty vs close.</HelpTip>
                </div>
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span>Risk-free (annual)</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    className="num"
                    type="number"
                    step="0.005"
                    value={p.riskFree}
                    onChange={(e) => setP({ ...p, riskFree: parseFloat(e.target.value || "0") })}
                    style={{ width: "100%" }}
                  />
                  <HelpTip title="Sharpe adjustment">Typical 0.01–0.05</HelpTip>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: 14 }}>
          <div className="panelHeader" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Metrics
            <HelpTip title="How to read">
              <b>CAGR</b> (growth), <b>Sharpe</b> (risk-adjusted), <b>Vol</b>, <b>Max DD</b>, <b>WinRate</b>,{" "}
              <b>Trades</b>.
            </HelpTip>
          </div>
          <div className="panelBody" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            <Stat k="CAGR" v={fmtPct(result.metrics.cagr)} />
            <Stat k="Sharpe" v={fmt2(result.metrics.sharpe)} />
            <Stat k="Volatility" v={fmtPct(result.metrics.vol)} />
            <Stat k="Max DD" v={fmtPct(result.metrics.maxdd)} />
            <Stat k="Win Rate" v={fmtPct(result.metrics.winRate)} />
            <Stat k="Trades" v={String(result.metrics.nTrades)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="panel" style={{ padding: 10 }}>
      <div style={{ opacity: 0.7, fontSize: 12 }}>{k}</div>
      <div style={{ fontWeight: 800, fontSize: 18 }}>{v}</div>
    </div>
  );
}
