import React,{useState} from "react";
import Layout from "@theme/Layout";
import { capFloorPV } from "../../lib/models";

export default function CapFloorPricer(){
  const [notional,setN]=useState(1_000_000);
  const [strike,setK]=useState(0.03);
  const [r,setR]=useState(0.028);
  const [vol,setVol]=useState(0.30);
  const [tenor,setTenor]=useState(5);
  const [freq,setFreq]=useState(4);
  const [isCap,setIsCap]=useState(true);

  const { pv } = capFloorPV(notional, strike, r, vol, tenor, freq, isCap);

  return (
    <Layout title="Cap / Floor">
      <div style={{maxWidth:900, margin:"0 auto", padding:18}}>
        <h1>Cap / Floor — Black-76 caplets</h1>
        <div className="panel" style={{padding:16, display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10}}>
          <label><div style={{opacity:.7}}>Notional</div><input className="num" type="number" value={notional} onChange={e=>setN(parseFloat(e.target.value||"0"))}/></label>
          <label><div style={{opacity:.7}}>Strike</div><input className="num" type="number" step="0.0005" value={strike} onChange={e=>setK(parseFloat(e.target.value||"0"))}/></label>
          <label><div style={{opacity:.7}}>Flat r</div><input className="num" type="number" step="0.0005" value={r} onChange={e=>setR(parseFloat(e.target.value||"0"))}/></label>
          <label><div style={{opacity:.7}}>Vol (LN)</div><input className="num" type="number" step="0.001" value={vol} onChange={e=>setVol(parseFloat(e.target.value||"0"))}/></label>
          <label><div style={{opacity:.7}}>Tenor (y)</div><input className="num" type="number" step="0.5" value={tenor} onChange={e=>setTenor(parseFloat(e.target.value||"0"))}/></label>
          <label><div style={{opacity:.7}}>Pay freq</div><input className="num" type="number" min={1} max={12} value={freq} onChange={e=>setFreq(parseInt(e.target.value||"0"))}/></label>
        </div>
        <div className="panel" style={{padding:16, marginTop:12}}>
          <label style={{display:"flex", gap:8, alignItems:"center"}}>
            <input type="checkbox" checked={isCap} onChange={e=>setIsCap(e.target.checked)}/> Cap (unchecked = Floor)
          </label>
          <div style={{marginTop:8}}>PV: <b>{pv.toFixed(2)}</b></div>
        </div>
      </div>
    </Layout>
  );
}
