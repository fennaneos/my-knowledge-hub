import React, {useEffect, useState} from "react";
import Layout from "@theme/Layout";
import PricerPanel from "../../components/PricerPanel";
import ForecastWidget from "../../components/ForecastWidget";
import { getQuote } from "../../lib/client";
import { priceBS } from "../../lib/pricers";
import { n2 } from "../../lib/format";

export default function EquityVanilla(){
  const [symbol,setSymbol]=useState("AAPL");
  const [spot,setSpot]=useState(100);
  const [K,setK]=useState(100);
  const [r,setR]=useState(0.02);
  const [vol,setVol]=useState(0.25);
  const [T,setT]=useState(0.5);
  const [cp,setCP]=useState<"C"|"P">("C");
  const [px,setPx]=useState<number|null>(null);

  useEffect(()=>{
    getQuote(symbol).then(q=>{ if(Number.isFinite(q.price)) setSpot(q.price); });
  },[symbol]);

  const run = async()=>{
    const {price} = await priceBS({S:spot,K,r,vol,T,cp});
    setPx(price);
  };

  return (
    <Layout title="Equity Vanilla" description="Black–Scholes pricer">
      <div style={{maxWidth:1100, margin:"0 auto", padding:16, display:"grid", gap:16, gridTemplateColumns:"1.1fr .9fr"}}>
        <PricerPanel title="Black–Scholes (Call/Put)">
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8}}>
            <label>Symbol<input className="input" value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())}/></label>
            <label>Spot<input className="num" type="number" value={spot} onChange={e=>setSpot(+e.target.value||0)}/></label>
            <label>Strike<input className="num" type="number" value={K} onChange={e=>setK(+e.target.value||0)}/></label>
            <label>r (annual)<input className="num" type="number" step="0.005" value={r} onChange={e=>setR(+e.target.value||0)}/></label>
            <label>vol (σ)<input className="num" type="number" step="0.01" value={vol} onChange={e=>setVol(+e.target.value||0)}/></label>
            <label>T (years)<input className="num" type="number" step="0.01" value={T} onChange={e=>setT(+e.target.value||0)}/></label>
          </div>
          <div style={{display:"flex", gap:8, alignItems:"center", marginTop:6}}>
            <button className={cp==="C"?"btn-neo-blue":"btn-ghost-blue"} onClick={()=>setCP("C")}>Call</button>
            <button className={cp==="P"?"btn-neo-blue":"btn-ghost-blue"} onClick={()=>setCP("P")}>Put</button>
            <button className="btn-neo-blue" style={{marginLeft:"auto"}} onClick={run}>Price</button>
          </div>
          <div className="panel" style={{padding:10, marginTop:8}}>
            <div style={{opacity:.7,fontSize:12}}>Model output</div>
            <div style={{fontWeight:800, fontSize:18}}>{px==null?"—":n2(px)}</div>
          </div>
        </PricerPanel>

        <ForecastWidget spot={spot} />
      </div>
    </Layout>
  );
}
