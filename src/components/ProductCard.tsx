// src/components/ProductCard.tsx
import React, { useEffect, useMemo, useState } from "react";
import SparklineCanvas from "./SparklineCanvas";
import {
  loadSeries, loadMany, lastAndChange, pctReturn, realizedVol, pearson, type OHLC
} from "../lib/marketData";
import type { ProductMeta } from "../lib/products";
import CorrelationMini from "./CorrelationMini";



export default function ProductCard({ meta }: { meta: ProductMeta }) {
  const [series, setSeries] = useState<number[]>([]);
  const [ohlc, setOhlc] = useState<OHLC | null>(null);
  const [last, setLast] = useState<number | null>(null);
  const [chg, setChg] = useState<number>(0);
  const [open, setOpen] = useState(false);

  const symbols = useMemo(() => meta.defaultSymbol.split(",").map(s => s.trim()).filter(Boolean), [meta.defaultSymbol]);

  // main series (if multi, use the first symbol for headline)
  useEffect(() => {
    let alive = true;
    const main = symbols[0] || meta.defaultSymbol;
    loadSeries(main, 180).then((o) => {
      if (!alive) return;
      setOhlc(o);
      setSeries(o.c);
      const { last, chg } = lastAndChange(o);
      setLast(last);
      setChg(chg);
    });
    return () => { alive = false; };
  }, [symbols, meta.defaultSymbol]);

  const up = chg >= 0;
  const pct = Number.isFinite(chg) ? (chg * 100).toFixed(2) + "%" : "--";
  const lastTxt = Number.isFinite(last as number) ? (last as number).toFixed(2) : "--";

  const stats = useMemo(() => {
    if (!ohlc) return null;
    return {
      r1d: pctReturn(ohlc, 1),
      r1w: pctReturn(ohlc, 5),
      r1m: pctReturn(ohlc, 21),
      vol30: realizedVol(ohlc, 30),
    };
  }, [ohlc]);

  // correlation (if multiple symbols)
  const [corr, setCorr] = useState<number[] | null>(null);
  useEffect(() => {
    let alive = true;
    if (symbols.length < 2) { setCorr(null); return; }
    loadMany(symbols, 180).then((map) => {
      if (!alive) return;
      const n = symbols.length;
      const out: number[] = Array(n * n).fill(1);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const a = map[symbols[i]].c, b = map[symbols[j]].c;
          const v = pearson(a, b);
          out[i * n + j] = out[j * n + i] = v ?? 0;
        }
      }
      setCorr(out);
    });
    return () => { alive = false; };
  }, [symbols]);

  const Stat = ({ k, v, pct=false }: { k: string; v: number | null | undefined; pct?: boolean }) => (
    <div className="panel" style={{padding:10}}>
      <div style={{opacity:.7, fontSize:12}}>{k}</div>
      <div style={{fontWeight:800}}>
        {v == null ? "—" : pct ? `${(v*100).toFixed(2)}%` : v.toFixed(2)}
      </div>
    </div>
  );

  return (
    <div className="panel" style={{
      padding: 16, borderRadius: 18,
      background: "linear-gradient(140deg, rgba(20,22,29,.9), rgba(10,12,17,.95))",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,.07), 0 12px 36px rgba(0,0,0,.35)",
      display: "grid", gap: 10
    }}>
      <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:18, fontWeight:800}}>{meta.title}</div>
          <div style={{opacity:.75, fontSize:13}}>{meta.teaser}</div>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <span className="lux-chip">{meta.category}</span>
          {meta.badge && <span className="lux-chip">{meta.badge}</span>}
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr auto", gap:10, alignItems:"center"}}>
        <SparklineCanvas data={series} />
        <div style={{textAlign:"right"}}>
          <div style={{fontWeight:800}}>{symbols.join(" · ")}</div>
          <div style={{fontFamily:"ui-monospace,monospace"}}>
            <span style={{opacity:.85, marginRight:6}}>{lastTxt}</span>
            <span style={{color: up ? "#21e087" : "#ff6b6b"}}>{up ? "▲" : "▼"} {pct}</span>
          </div>
        </div>
      </div>

      <div className="cta-group">
        <a className="btn-neo-blue" href={meta.pricerHref}>Price</a>
        <a className="btn-ghost-blue" href={meta.simulateHref || "/lab"}>Simulate</a>
        {meta.docsHref && <a className="btn-wire" href={meta.docsHref}>Docs</a>}
        <a className="btn-ghost-blue" href={`/analytics?symbol=${encodeURIComponent(symbols[0] || meta.defaultSymbol)}`}>Predict</a>
        <button className="btn-ghost-blue" onClick={()=>setOpen(v=>!v)}>{open ? "Hide" : "Details"}</button>
      </div>

      {open && (
        <div className="panel" style={{padding:12, display:"grid", gap:10}}>
          <div className="panelHeader">Snapshot</div>
          <div className="panelBody" style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8}}>
            <Stat k="1D" v={stats?.r1d ?? null} pct />
            <Stat k="1W" v={stats?.r1w ?? null} pct />
            <Stat k="1M" v={stats?.r1m ?? null} pct />
            <Stat k="Realized Vol (30d)" v={stats?.vol30 ?? null} />
          </div>

          {symbols.length > 1 && corr && (
            <>
              <div className="panelHeader">Correlations</div>
              <CorrelationMini labels={symbols} values={corr} />
            </>
          )}

          {/* mini quick-params (demo-only UI) */}
          <div className="panelHeader">Quick Params</div>
          <div className="panelBody" style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8}}>
            <label style={{display:"grid", gap:4}}>
              <span>Tenor</span>
              <select className="input"><option>3M</option><option>6M</option><option>1Y</option></select>
            </label>
            <label style={{display:"grid", gap:4}}>
              <span>Strike</span>
              <input className="input" placeholder="e.g. 100%" defaultValue="100%" />
            </label>
            <label style={{display:"grid", gap:4}}>
              <span>Notional</span>
              <input className="input" placeholder="e.g. 10,000" defaultValue="10,000" />
            </label>
          </div>
          <div className="cta-group" style={{justifyContent:"flex-end"}}>
            <a className="btn-neo-blue" href={meta.pricerHref}>Open Full Pricer</a>
          </div>
        </div>
      )}
    </div>
  );
}
