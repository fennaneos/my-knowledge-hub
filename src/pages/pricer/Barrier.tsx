import React,{useState} from "react";
import Layout from "@theme/Layout";
import { barrierOut } from "../../lib/models";

export default function BarrierPricer(){
  const [S,setS]=useState(100), [K,setK]=useState(100), [H,setH]=useState(120);
  const [r,setR]=useState(0.02), [q,setQ]=useState(0.00), [vol,setVol]=useState(0.25), [T,setT]=useState(1);
  const [call,setCall]=useState(true);

  const { price } = barrierOut(S,K,H,r,q,vol,T,call);

  return (
    <Layout title="Barrier Out Option">
      <div style={{maxWidth:900, margin:"0 auto", padding:18}}>
        <h1>Barrier (Out) — Reiner–Rubinstein</h1>
        <div className="panel" style={{padding:16, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10}}>
          {[
            ["S",S,setS], ["K",K,setK], ["H (barrier)",H,setH], ["T (years)",T,setT],
            ["r",r,setR], ["q",q,setQ], ["σ",vol,setVol],
          ].map(([k,v,fn]:any)=>(
            <label key={k}><div style={{opacity:.7}}>{k}</div>
              <input className="num" type="number" value={v} step="0.01" onChange={e=>fn(parseFloat(e.target.value||"0"))}/>
            </label>
          ))}
          <label style={{display:"flex", alignItems:"end", gap:6}}>
            <input type="checkbox" checked={call} onChange={e=>setCall(e.target.checked)}/> Call (else Put)
          </label>
        </div>
        <div className="panel" style={{padding:16, marginTop:12}}>
          Price: <b>{price.toFixed(4)}</b>
        </div>
      </div>
    </Layout>
  );
}
