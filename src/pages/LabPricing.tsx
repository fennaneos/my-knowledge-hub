// src/pages/LabPricing.tsx
import React from "react";

const WEEKLY = (import.meta as any).env?.VITE_LABS_WEEKLY || "#";
const MONTHLY = (import.meta as any).env?.VITE_LABS_MONTHLY || "#";
const ANNUAL = (import.meta as any).env?.VITE_LABS_ANNUAL || "#";
const TEAMS = (import.meta as any).env?.VITE_LABS_TEAMS || "#";

function Card({
  title, price, cadence, bullets, href, badge, highlight
}:{
  title:string; price:string; cadence:string; bullets:string[]; href:string; badge?:string; highlight?:boolean;
}){
  return (
    <div className="panel" style={{
      borderRadius:18, padding:22,
      background:"linear-gradient(140deg, rgba(20,22,29,.9), rgba(10,12,17,.95))",
      boxShadow: highlight
        ? "inset 0 0 0 1px rgba(212,175,55,.45), 0 20px 60px rgba(0,0,0,.45)"
        : "inset 0 0 0 1px rgba(255,255,255,.08), 0 16px 40px rgba(0,0,0,.35)"
    }}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
        <h3 style={{margin:0}}>{title}</h3>
        {badge && <span className="lux-chip" style={{background:"rgba(139,123,255,.15)", border:"1px solid rgba(139,123,255,.5)"}}>{badge}</span>}
      </div>
      <div style={{display:"flex", alignItems:"baseline", gap:6, marginTop:12}}>
        <div style={{fontSize:36, fontWeight:800}}>{price}</div>
        <div style={{opacity:.8}}>{cadence}</div>
      </div>
      <ul style={{margin:"12px 0 16px 18px", display:"grid", gap:8}}>
        {bullets.map((b,i)=><li key={i} style={{opacity:.9}}>{b}</li>)}
      </ul>
<a className="btn-neo-red-modern pulse" href={href} target="_blank" rel="noreferrer" style={{width:'100%',textAlign:'center'}}>
  Get Access
</a>


      <div style={{fontSize:12, opacity:.6, marginTop:8}}>Secure checkout • Cancel anytime</div>
    </div>
  );
}

export default function LabPricing(){
  return (
    <div style={{maxWidth:1100, margin:"0 auto", padding:"28px 16px 80px"}}>
      <section style={{textAlign:"center", marginBottom:22}}>
        <div className="lux-chip" style={{marginBottom:10}}>AsraelX Labs</div>
        <h1 style={{margin:0, fontSize:44, lineHeight:1.1}}>Trade-grade simulations. Learning that compounds.</h1>
        <p style={{opacity:.85, marginTop:10}}>
          Unlock the Monte Carlo sandbox, AI mentor, weekly challenges, and performance-backed certificates.
        </p>
<div className="cta-group">
  <a className="btn-neo-blue" href="/">Home</a>
  <a className="btn-ghost-blue" href="/premium/volatility-handbook">Premium Courses</a>
  <a className="btn-ghost-blue" href="/lab">Open Lab <span className="badge-new">NEW</span></a>
</div>

      </section>

      <section id="plans" style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:14}}>
        // inside <section id="plans"> … </section>
<Card
  title="Explorer"
  price="$0"
  cadence="/forever"
  bullets={["Virtual Trading (demo data)", "EMA(9/21) overlays", "Docs & examples"]}
  href="/virtual-trading"
/>
<Card
  title="Trader"
  price="$39"
  cadence="/month"
  bullets={[
    "Virtual Trading Pro (persistent portfolio)",
    "Backtest Studio + CSV",
    "PnL / Equity & trade tape",
    "AI Mentor (standard)",
  ]}
  href={MONTHLY}
  badge="Popular"
  highlight
/>
<Card
  title="Architect"
  price="$349"
  cadence="/year"
  bullets={[
    "Everything in Trader",
    "Factor screens & walk-forward",
    "Cert export with live metrics",
    "Mentor deep-dives",
  ]}
  href={ANNUAL}
/>
<Card
  title="Teams"
  price="Custom"
  cadence="/year"
  bullets={["5–20 seats", "Seat dashboard", "Progress analytics", "Priority support"]}
  href={TEAMS}
/>

      </section>
    </div>
  );
}
