import React, {useMemo, useState} from "react";
import Layout from "@theme/Layout";
import HelpTip from "../components/HelpTip";

type Cat = "Equity"|"Rates"|"FX"|"Commodities"|"Credit"|"Structured";
type Prod = {
  id: string;
  name: string;
  cat: Cat;
  path: string;         // pricer route
  tags?: string[];      // e.g. ["Vanilla","Greeks"]
  badge?: "NEW"|"PRO"|"EXOTIC";
  blurb: string;
};

const ALL: Prod[] = [
  // ===== Equity =====
  { id:"eq-vanilla", name:"Vanilla Option (Call/Put)", cat:"Equity", path:"/pricer/vanilla-option",
    tags:["Vanilla","Greeks"], blurb:"Black–Scholes pricing with instant Greeks, implied vol solve.", badge:"NEW" },
  { id:"eq-barrier", name:"Barrier (KO/KI)", cat:"Equity", path:"/pricer/barrier",
    tags:["Exotic","MC"], blurb:"Monte Carlo barrier simulation with hit probability.", badge:"EXOTIC" },
  { id:"eq-asian", name:"Asian (Avg Price)", cat:"Equity", path:"/pricer/asian",
    tags:["Path Dep.","MC"], blurb:"Arithmetic/Geometric average options.", badge:"PRO" },
  { id:"eq-digital", name:"Digital (Cash-or-Nothing)", cat:"Equity", path:"/pricer/digital",
    tags:["Binary"], blurb:"Closed-form/MC hybrid with risk metrics." },

  // ===== Structured =====
  { id:"st-autocall", name:"Autocallable / Phoenix", cat:"Structured", path:"/pricer/autocallable",
    tags:["Coupon","KO","MC"], blurb:"Basket/autocall probability, coupon PV, loss distribution.", badge:"PRO" },
  { id:"st-reverse", name:"Reverse Convertible", cat:"Structured", path:"/pricer/reverse-convertible",
    tags:["Income","Downside"], blurb:"Yield vs downside trade-off explorer.", badge:"PRO" },
  { id:"st-range", name:"Range Accrual (Equity/FX)", cat:"Structured", path:"/pricer/range-accrual",
    tags:["Accrual","Path Dep."], blurb:"Inside-range accrual probability and PV.", badge:"PRO" },

  // ===== Rates =====
  { id:"rt-curve", name:"Yield Curve (NS/Svensson)", cat:"Rates", path:"/pricer/yield-curve",
    tags:["Curve"], blurb:"Fit and project curve, forward rates and discount factors." },
  { id:"rt-swaption", name:"Swaption", cat:"Rates", path:"/pricer/swaption",
    tags:["IR Vol"], blurb:"Normal/Lognormal vol, Hull–White sketch.", badge:"PRO" },
  { id:"rt-capfloor", name:"Cap / Floor", cat:"Rates", path:"/pricer/cap-floor",
    tags:["IR Vol","Term Structure"], blurb:"SABR/Black pricing and PV.", badge:"PRO" },

  // ===== FX =====
  { id:"fx-vanilla", name:"FX Vanilla (Garman–Kohlhagen)", cat:"FX", path:"/pricer/fx-vanilla",
    tags:["FX","Carry"], blurb:"Domestic/foreign rates, forward parity, Greeks." },
  { id:"fx-barrier", name:"FX Barrier", cat:"FX", path:"/pricer/fx-barrier",
    tags:["Exotic","MC"], blurb:"Touch/KO probabilities with quanto adjustments.", badge:"PRO" },

  // ===== Commodities =====
  { id:"cmd-ow", name:"OU Mean-Reversion", cat:"Commodities", path:"/pricer/ou-commodity",
    tags:["Term","Hedge"], blurb:"Seasonality + OU reversion; forward curve scenarios." },

  // ===== Credit =====
  { id:"crd-cds", name:"CDS (Flat Hazard)", cat:"Credit", path:"/pricer/cds",
    tags:["Credit","Spread"], blurb:"PV legs, par spread, survival curve sketch.", badge:"PRO" },
];

const CATS: Cat[] = ["Equity","Structured","Rates","FX","Commodities","Credit"];

export default function ProductsWorkbench(){
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat | "All">("All");
  const [showPro, setShowPro] = useState(true);
  const [tags, setTags] = useState<string[]>([]);

  const allTags = useMemo(()=> {
    const s = new Set<string>();
    ALL.forEach(p => p.tags?.forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, []);

  const filtered = useMemo(()=>{
    return ALL.filter(p => {
      if (cat !== "All" && p.cat !== cat) return false;
      if (!showPro && p.badge === "PRO") return false;
      if (q && !(p.name.toLowerCase().includes(q.toLowerCase()) || p.blurb.toLowerCase().includes(q.toLowerCase()))) return false;
      if (tags.length && !tags.every(t => p.tags?.includes(t))) return false;
      return true;
    });
  }, [q, cat, showPro, tags]);

  const toggleTag = (t:string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]);
  };

  return (
    <Layout title="Product Workbench" description="Price every product — from vanilla to exotics">
      <div style={{maxWidth:1200, margin:"0 auto", padding:"18px 16px 80px"}}>
        {/* Header */}
        <div className="panel" style={{padding:18, display:"grid", gap:10}}>
          <div className="panelHeader" style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <div style={{display:"flex", gap:10, alignItems:"center"}}>
              <h1 style={{margin:0}}>Product Workbench</h1>
              <span className="lux-chip">Quant Suite</span>
              <HelpTip title="About">
                A single console to price Equity, Rates, FX, Commodities, Credit &amp; Structured products. Use search, filters, and open the pricer you need.
              </HelpTip>
            </div>
            <div className="cta-group">
              <a className="btn-neo-blue" href="/">Home</a>
              <a className="btn-ghost-blue" href="/lab">Open Lab</a>
              <a className="btn-neo-red-modern" href="/pricing-labs">Get Pro</a>
            </div>
          </div>

          {/* Controls */}
          <div className="panelBody" style={{display:"grid", gap:10}}>
            <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
              <button className={cat==="All"?"btn-neo-blue":"btn-ghost-blue"} onClick={()=>setCat("All")}>All</button>
              {CATS.map(c => (
                <button key={c} className={cat===c?"btn-neo-blue":"btn-ghost-blue"} onClick={()=>setCat(c)}>{c}</button>
              ))}
              <div style={{marginLeft:"auto", display:"flex", gap:8, alignItems:"center"}}>
                <input className="input" placeholder="Search product…" value={q} onChange={e=>setQ(e.target.value)} style={{minWidth:220}}/>
                <label className="lux-chip" style={{cursor:"pointer"}}>
                  <input type="checkbox" checked={showPro} onChange={e=>setShowPro(e.target.checked)} style={{marginRight:6}}/>
                  Show PRO
                </label>
              </div>
            </div>
            <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
              {allTags.map(t => (
                <button key={t}
                  className={tags.includes(t) ? "lux-btn" : "lux-outline"}
                  onClick={()=>toggleTag(t)}
                  title="Filter by tag"
                >{t}</button>
              ))}
              {tags.length>0 && <button className="lux-ghost" onClick={()=>setTags([])}>Clear tags</button>}
            </div>
          </div>
        </div>

        {/* Grid */}
        <section style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px,1fr))", gap:14, marginTop:14}}>
          {filtered.map(p => (
            <article key={p.id} className="panel" style={{padding:16, display:"grid", gap:10}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
                <h3 style={{margin:0}}>{p.name}</h3>
                <div style={{display:"flex", gap:6}}>
                  <span className="lux-chip" style={{opacity:.8}}>{p.cat}</span>
                  {p.badge && <span className="lux-chip" style={{
                    background: p.badge==="PRO" ? "rgba(255,60,60,.15)" :
                                p.badge==="EXOTIC" ? "rgba(164,114,255,.15)" : "rgba(33,224,135,.15)",
                    border: "1px solid rgba(255,255,255,.18)"
                  }}>{p.badge}</span>}
                </div>
              </div>
              <div style={{opacity:.85}}>{p.blurb}</div>
              {p.tags?.length ? (
                <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                  {p.tags.map(t => <span key={t} className="lux-chip" style={{opacity:.75}}>{t}</span>)}
                </div>
              ): null}
              <div style={{display:"flex", gap:8, marginTop:4}}>
                <a className="btn-neo-blue" href={p.path}>Open Pricer</a>
                {p.badge==="PRO"
                  ? <a className="btn-neo-red-modern" href="/pricing-labs">Upgrade</a>
                  : <a className="btn-ghost-blue" href="/finance/ema-macd-strategy">Docs</a>}
              </div>
            </article>
          ))}
          {filtered.length===0 && (
            <div className="panel" style={{padding:16, textAlign:"center", gridColumn:"1 / -1", opacity:.7}}>
              No products match your filters.
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
