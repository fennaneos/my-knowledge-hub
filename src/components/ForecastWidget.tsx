import React, {useMemo} from "react";
import { n2 } from "../lib/format";

function gbmPath(S0:number, mu:number, vol:number, T:number, steps=252){
  const dt=T/steps; const out=[S0]; let S=S0;
  for(let i=0;i<steps;i++){
    const z = Math.sqrt(-2*Math.log(Math.random()))*Math.cos(2*Math.PI*Math.random());
    S = S * Math.exp((mu-0.5*vol*vol)*dt + vol*Math.sqrt(dt)*z);
    out.push(S);
  }
  return out;
}

export default function ForecastWidget({spot, mu=0.08, vol=0.2, T=1}:{spot:number; mu?:number; vol?:number; T?:number}){
  const paths = useMemo(()=> Array.from({length:50}, ()=> gbmPath(spot,mu,vol,T,126)), [spot,mu,vol,T]);
  const last = paths.map(p=>p[p.length-1]);
  const mean = last.reduce((a,b)=>a+b,0)/last.length;
  const up   = last.filter(x=>x>spot).length/last.length;

  return (
    <div className="panel" style={{padding:12}}>
      <div className="panelHeader">Monte Carlo Forecast (preview)</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        <div className="panel" style={{padding:10}}><div style={{opacity:.7,fontSize:12}}>Expected</div><div style={{fontWeight:800}}>{n2(mean)}</div></div>
        <div className="panel" style={{padding:10}}><div style={{opacity:.7,fontSize:12}}>P(Up)</div><div style={{fontWeight:800}}>{(up*100).toFixed(1)}%</div></div>
        <div className="panel" style={{padding:10}}><div style={{opacity:.7,fontSize:12}}>Vol (assumed)</div><div style={{fontWeight:800}}>{(vol*100).toFixed(1)}%</div></div>
      </div>
      <div style={{opacity:.7, fontSize:12, marginTop:8}}>Educational preview. Pro unlocks paths, seed, and scenario exports.</div>
    </div>
  );
}
