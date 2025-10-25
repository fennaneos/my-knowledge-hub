import React, {useMemo, useState} from "react";
import Layout from "@theme/Layout";
import HelpTip from "../../components/HelpTip";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

function normCdf(x:number){ return 0.5 * (1 + Math.erf(x/Math.SQRT2)); }
function normPdf(x:number){ return Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI); }

function bsPriceGreeks(S:number, K:number, r:number, q:number, vol:number, T:number){
  if (T<=0 || vol<=0 || S<=0 || K<=0) return {call:0, put:0, deltaC:0, deltaP:0, gamma:0, vega:0, thetaC:0, thetaP:0, rhoC:0, rhoP:0, d1:NaN, d2:NaN};
  const fwd = S*Math.exp((r-q)*T);
  const d1 = (Math.log(S/K) + (r-q + 0.5*vol*vol)*T) / (vol*Math.sqrt(T));
  const d2 = d1 - vol*Math.sqrt(T);
  const Nd1 = normCdf(d1), Nd2 = normCdf(d2);
  const Nmd1 = normCdf(-d1), Nmd2 = normCdf(-d2);

  const disc = Math.exp(-r*T), dfq = Math.exp(-q*T);
  const call = S*dfq*Nd1 - K*disc*Nd2;
  const put  = K*disc*Nmd2 - S*dfq*Nmd1;

  const gamma = dfq*normPdf(d1) / (S*vol*Math.sqrt(T));
  const vega  = S*dfq*normPdf(d1)*Math.sqrt(T);         // per 1.00 vol; divide by 100 for per 1 vol point
  const deltaC = dfq*Nd1;
  const deltaP = dfq*(Nd1-1);
  const thetaC = - (S*dfq*normPdf(d1)*vol)/(2*Math.sqrt(T)) - r*K*disc*Nd2 + q*S*dfq*Nd1;
  const thetaP = - (S*dfq*normPdf(d1)*vol)/(2*Math.sqrt(T)) + r*K*disc*Nmd2 - q*S*dfq*Nmd1;
  const rhoC   =  K*T*disc*Nd2;
  const rhoP   = -K*T*disc*Nmd2;

  return {call, put, deltaC, deltaP, gamma, vega, thetaC, thetaP, rhoC, rhoP, d1, d2};
}

export default function VanillaOption(){
  const [S, setS]   = useState(100);
  const [K, setK]   = useState(100);
  const [r, setR]   = useState(0.02);
  const [q, setQ]   = useState(0.00);
  const [vol, setV] = useState(0.2);
  const [T, setT]   = useState(1.0);

  const R = useMemo(()=>bsPriceGreeks(S,K,r,q,vol,T), [S,K,r,q,vol,T]);

  const fmt = (x:number)=> Number.isFinite(x) ? (Math.abs(x)>=1000? x.toFixed(0): x.toFixed(4)) : "--";

  return (
    <Layout title="Vanilla Option Pricer" description="Black–Scholes with Greeks">
      <div style={{maxWidth:1100, margin:"0 auto", padding:"18px 16px 60px", display:"grid", gap:14}}>
        <div className="panel" style={{padding:16}}>
          <div className="panelHeader" style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div style={{display:"flex", gap:10, alignItems:"center"}}>
              <h1 style={{margin:0}}>Vanilla Option (BS) </h1>
              <span className="lux-chip">Equity</span>
              <HelpTip title="Formula">
                Black–Scholes (continuous rates). Supports dividend yield q. Outputs call/put price and Greeks.
              </HelpTip>
            </div>
            <div className="cta-group">
              <a className="btn-neo-blue" href="/products">← Workbench</a>
              <a className="btn-ghost-blue" href="/pricing-labs">Get Pro</a>
            </div>
          </div>

          <div className="panelBody" style={{display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:12}}>
            {/* Inputs */}
            <div className="panel" style={{padding:12}}>
              <div className="panelHeader">Inputs</div>
              <div className="panelBody" style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
                <label style={{display:"grid", gap:4}}>
                  <span>S (spot)</span>
                  <input className="num" type="number" value={S} onChange={e=>setS(parseFloat(e.target.value||"0"))}/>
                </label>
                <label style={{display:"grid", gap:4}}>
                  <span>K (strike)</span>
                  <input className="num" type="number" value={K} onChange={e=>setK(parseFloat(e.target.value||"0"))}/>
                </label>
                <label style={{display:"grid", gap:4}}>
                  <span>σ (vol)</span>
                  <input className="num" type="number" step="0.01" value={vol} onChange={e=>setV(parseFloat(e.target.value||"0"))}/>
                </label>
                <label style={{display:"grid", gap:4}}>
                  <span>T (years)</span>
                  <input className="num" type="number" step="0.01" value={T} onChange={e=>setT(parseFloat(e.target.value||"0"))}/>
                </label>
                <label style={{display:"grid", gap:4}}>
                  <span>r (domestic)</span>
                  <input className="num" type="number" step="0.001" value={r} onChange={e=>setR(parseFloat(e.target.value||"0"))}/>
                </label>
                <label style={{display:"grid", gap:4}}>
                  <span>q (dividend)</span>
                  <input className="num" type="number" step="0.001" value={q} onChange={e=>setQ(parseFloat(e.target.value||"0"))}/>
                </label>
              </div>
            </div>

            {/* Results */}
            <div className="panel" style={{padding:12}}>
              <div className="panelHeader">Results</div>
              <div className="panelBody" style={{display:"grid", gap:8}}>
                <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8}}>
                  <Stat k="Call" v={fmt(R.call)}/>
                  <Stat k="Put"  v={fmt(R.put)}/>
                </div>
                <div className="sep" />
                <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8}}>
                  <Stat k="Δ (Call)" v={fmt(R.deltaC)}/>
                  <Stat k="Δ (Put)"  v={fmt(R.deltaP)}/>
                  <Stat k="Γ" v={fmt(R.gamma)}/>
                </div>
                <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8}}>
                  <Stat k="Vega" v={fmt(R.vega)}/>
                  <Stat k="Θ (Call/day)" v={fmt(R.thetaC/365)}/>
                  <Stat k="Θ (Put/day)"  v={fmt(R.thetaP/365)}/>
                </div>
                <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8}}>
                  <Stat k="ρ (Call)" v={fmt(R.rhoC)}/>
                  <Stat k="ρ (Put)"  v={fmt(R.rhoP)}/>
                </div>
              </div>
            </div>
          </div>

          {/* Math explainer */}
          <div className="panel" style={{padding:12}}>
            <div className="panelHeader">Mathematical Notes</div>
            <div className="panelBody" style={{lineHeight:1.7}}>
              <p>
                <InlineMath math={"d_1=\\frac{\\ln(S/K)+(r-q+\\tfrac12\\sigma^2)T}{\\sigma\\sqrt{T}},\\quad d_2=d_1-\\sigma\\sqrt{T}"} />
              </p>
              <p>
                <InlineMath math={"C = S e^{-qT}N(d_1) - K e^{-rT}N(d_2),\\quad P = K e^{-rT}N(-d_2) - S e^{-qT}N(-d_1)"} />
              </p>
              <p>
                Greeks are computed in closed form (spot in domestic currency, continuous compounding). For implied vol, add a root-finder on price error.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Stat({k,v}:{k:string; v:string}){
  return (
    <div className="panel" style={{padding:10}}>
      <div style={{opacity:.7, fontSize:12}}>{k}</div>
      <div style={{fontWeight:800, fontSize:18}}>{v}</div>
    </div>
  );
}
