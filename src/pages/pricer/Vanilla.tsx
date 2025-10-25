import React, {useState} from "react";
import Layout from "@theme/Layout";
import { blackScholes } from "../../lib/models";

export default function VanillaPricer(){
  const [S,setS]=useState(100); const [K,setK]=useState(100);
  const [r,setR]=useState(0.02); const [q,setQ]=useState(0.00);
  const [vol,setVol]=useState(0.20); const [T,setT]=useState(1);
  const [call,setCall]=useState(true);

  const { price, greeks } = blackScholes(S,K,r,q,vol,T,call);

  return (
    <Layout title="Vanilla Option (BS)">
      <div style={{maxWidth:900, margin:"0 auto", padding:"18px"}}>
        <h1>Vanilla Option — Black–Scholes</h1>
        <div className="panel" style={{padding:16, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
          {[
            ["Spot S", S, setS, 0.01], ["Strike K", K, setK, 0.01], ["T (years)", T, setT, 0.01],
            ["Rate r", r, setR, 0.001], ["Div q", q, setQ, 0.001], ["Vol σ", vol, setVol, 0.001],
          ].map(([k,v,fn,step]:any)=>(
            <label key={k}><div style={{opacity:.7}}>{k}</div>
              <input className="num" type="number" value={v} step={step} onChange={e=>fn(parseFloat(e.target.value||"0"))}/>
            </label>
          ))}
          <label style={{display:"flex", alignItems:"end", gap:6}}>
            <input type="checkbox" checked={call} onChange={e=>setCall(e.target.checked)}/> Call (unchecked = Put)
          </label>
        </div>

        <div className="panel" style={{padding:16, marginTop:12}}>
          <div className="panelHeader">Result</div>
          <div>Price: <b>{price.toFixed(4)}</b></div>
          {greeks && (
            <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginTop:8}}>
              <div>Δ {greeks.delta.toFixed(4)}</div>
              <div>Γ {greeks.gamma.toFixed(6)}</div>
              <div>Vega {greeks.vega.toFixed(4)}</div>
              <div>Θ {greeks.theta.toFixed(4)}</div>
              <div>ρ {greeks.rho.toFixed(4)}</div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
