import React, {useEffect, useState} from "react";
import Layout from "@theme/Layout";
import PricerPanel from "../../components/PricerPanel";
import { getQuote } from "../../lib/client";
import { priceFXFwd } from "../../lib/pricers";
import { n2 } from "../../lib/format";

export default function FXForward(){
  const [symbol,setSymbol]=useState("EURUSD");
  const [S,setS]=useState(1.10);
  const [rD,setRD]=useState(0.035);
  const [rF,setRF]=useState(0.01);
  const [T,setT]=useState(0.5);
  const [F,setF]=useState<number|null>(null);

  useEffect(()=>{ getQuote(symbol).then(q=>{ if(Number.isFinite(q.price)) setS(q.price); }); },[symbol]);

  const run = async()=>{ const {forward}=await priceFXFwd({S,r_dom:rD,r_for:rF,T}); setF(forward); };

  return (
    <Layout title="FX Forward" description="Covered interest parity">
      <div style={{maxWidth:900, margin:"0 auto", padding:16, display:"grid", gap:16}}>
        <PricerPanel title="Forward Pricing">
          <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8}}>
            <label>Symbol<input className="input" value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())}/></label>
            <label>Spot S<input className="num" type="number" step="0.0001" value={S} onChange={e=>setS(+e.target.value||0)}/></label>
            <label>r<sub>dom</sub><input className="num" type="number" step="0.005" value={rD} onChange={e=>setRD(+e.target.value||0)}/></label>
            <label>r<sub>for</sub><input className="num" type="number" step="0.005" value={rF} onChange={e=>setRF(+e.target.value||0)}/></label>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:6}}>
            <label>T (years)<input className="num" type="number" step="0.01" value={T} onChange={e=>setT(+e.target.value||0)}/></label>
            <button className="btn-neo-blue" onClick={run}>Price Forward</button>
          </div>
          <div className="panel" style={{padding:10, marginTop:8}}>
            <div style={{opacity:.7,fontSize:12}}>Forward</div>
            <div style={{fontWeight:800, fontSize:18}}>{F==null?"—":n2(F)}</div>
          </div>
        </PricerPanel>
      </div>
    </Layout>
  );
}
