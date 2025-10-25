import React,{useState} from "react";
import Layout from "@theme/Layout";
import { swapPV } from "../../lib/models";

export default function SwapPricer(){
  const [notional,setN]=useState(1_000_000);
  const [fixed,setFixed]=useState(0.03);
  const [r,setR]=useState(0.028);
  const [tenor,setTenor]=useState(5);
  const [freq,setFreq]=useState(2);

  const { pv, parRate } = swapPV(notional, fixed, r, tenor, freq);

  return (
    <Layout title="Interest Rate Swap">
      <div style={{maxWidth:900, margin:"0 auto", padding:18}}>
        <h1>IRS — Fixed-for-Float (flat curve)</h1>
        <div className="panel" style={{padding:16, display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10}}>
          <label><div style={{opacity:.7}}>Notional</div><input className="num" type="number" value={notional} onChange={e=>setN(parseFloat(e.target.value||"0"))}/></label>
          <label><div style={{opacity:.7}}>Fixed rate</div><input className="num" type="number" step="0.0005" value={fixed} onChange={e=>setFixed(parseFloat(e.target.value||"0"))}/></label>
          <label><div style={{opacity:.7}}>Flat r</div><input className="num" type="number" step="0.0005" value={r} onChange={e=>setR(parseFloat(e.target.value||"0"))}/></label>
          <label><div style={{opacity:.7}}>Tenor (y)</div><input className="num" type="number" step="0.5" value={tenor} onChange={e=>setTenor(parseFloat(e.target.value||"0"))}/></label>
          <label><div style={{opacity:.7}}>Pay freq</div><input className="num" type="number" min={1} max={12} value={freq} onChange={e=>setFreq(parseInt(e.target.value||"0"))}/></label>
        </div>
        <div className="panel" style={{padding:16, marginTop:12}}>
          <div>Par rate: <b>{(parRate*100).toFixed(3)}%</b></div>
          <div>PV (receiver FLOAT, payer FIXED @ { (fixed*100).toFixed(2)}%): <b>{pv.toFixed(2)}</b></div>
        </div>
      </div>
    </Layout>
  );
}
