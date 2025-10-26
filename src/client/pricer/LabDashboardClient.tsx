

// src/pages/LabDashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/* ========= helpers: stats & storage ========= */
type RunResult = {
  id: string;
  when: number;
  user: string;
  equity: number[];     // equity curve (normalized to 1.0)
  sharpe: number;
  vol: number;
  maxdd: number;
  params: SimParams;
};

type SimParams = {
  start: number;        // starting capital
  days: number;         // trading days
  mu: number;           // annual return (decimal)
  sigma: number;        // annual volatility (decimal)
  paths: number;        // # simulated paths
  rf: number;           // annual risk-free (decimal)
  seed?: number | null; // optional seed
};

function clamp(n:number, lo:number, hi:number){ return Math.max(lo, Math.min(hi, n)); }
function rnd(seedRef: {v:number}) { // very small LCG
  seedRef.v = (seedRef.v * 48271) % 0x7fffffff;
  return seedRef.v / 0x7fffffff;
}

function gbmPath(days: number, mu: number, sigma: number, seedRef?: {v:number}) {
  const dt = 1/252;
  let s = 1;
  const arr = [s];
  for (let i=1;i<=days;i++){
    // Box-Muller
    const u1 = seedRef ? rnd(seedRef) : Math.random();
    const u2 = seedRef ? rnd(seedRef) : Math.random();
    const z = Math.sqrt(-2*Math.log(u1)) * Math.cos(2*Math.PI*u2);
    const ret = (mu - 0.5*sigma*sigma)*dt + sigma*Math.sqrt(dt)*z;
    s *= Math.exp(ret);
    arr.push(s);
  }
  return arr;
}

function maxDrawdown(equity: number[]) {
  let peak = equity[0], mdd = 0;
  for (const v of equity){
    peak = Math.max(peak, v);
    mdd = Math.max(mdd, (peak - v)/peak);
  }
  return mdd;
}

function annStats(equity: number[], rf:number){
  // daily log returns from equity
  const rets:number[] = [];
  for (let i=1;i<equity.length;i++){
    rets.push(Math.log(equity[i]/equity[i-1]));
  }
  const mean = rets.reduce((a,b)=>a+b,0)/Math.max(1,rets.length);
  const varr = rets.reduce((a,b)=>a+(b-mean)*(b-mean),0)/Math.max(1,rets.length);
  const sd   = Math.sqrt(varr);
  const annMean = mean*252;
  const annVol  = sd*Math.sqrt(252);
  const sharpe  = annVol>0 ? (annMean - rf)/annVol : 0;
  return { sharpe, vol: annVol };
}

function fmtPct(x:number){ return (x*100).toFixed(2)+"%"; }
function fmt2(x:number){ return x.toFixed(2); }

/* ========= Sparkline (SVG) ========= */
function Sparkline({data, height=40}:{data:number[]; height?:number}){
  if (!data || data.length<2) return <div style={{height}} />;
  const w = 160;
  const min = Math.min(...data), max = Math.max(...data);
  const norm = (v:number)=> (max-min>0 ? (v-min)/(max-min) : 0.5);
  const pts = data.map((v,i)=>[ (i/(data.length-1))*w, (1-norm(v))*height ]);
  const d = pts.map((p,i)=> (i===0?`M${p[0]},${p[1]}`:`L${p[0]},${p[1]}`)).join(" ");
  const lastUp = data[data.length-1] >= data[0];
  return (
    <svg width={w} height={height} style={{display:"block"}}>
      <path d={d} fill="none" stroke={lastUp?"#21e087":"#ff6b6b"} strokeWidth={2}/>
    </svg>
  );
}

/* ========= Leaderboard (localStorage) ========= */
const LB_KEY = "lab:leaderboard";
function loadLB():RunResult[]{ try { return JSON.parse(localStorage.getItem(LB_KEY) || "[]"); } catch { return []; } }
function saveLB(arr:RunResult[]){ localStorage.setItem(LB_KEY, JSON.stringify(arr.slice(0,100))); }

/* ========= AI Mentor (stub) ========= */
function mentorExplain(r: RunResult){
  const tips:string[] = [];
  if (r.maxdd > 0.2) tips.push("Your max drawdown is high — consider lowering volatility or shortening path duration.");
  if (r.sharpe < 0.7) tips.push("Sharpe is modest — try increasing μ slightly or reducing σ to improve risk-adjusted return.");
  if (r.vol > 0.3) tips.push("Annualized volatility is elevated — check if your σ input is realistic for the asset mix.");
  if (!tips.length) tips.push("Nice balance between return and risk! Consider experimenting with correlation later.");
  return tips.join(" ");
}

/* ========= Main Page ========= */
export default function LabDashboardClient(){
  // username persisted for leaderboard
  const [user, setUser] = useState<string>(() => localStorage.getItem("lab:user") || "Guest");
  useEffect(()=>localStorage.setItem("lab:user", user), [user]);

  // params
  const [params, setParams] = useState<SimParams>({
    start: 10000, days: 252, mu: 0.10, sigma: 0.20, paths: 200, rf: 0.02, seed: null
  });

  // results
  const [result, setResult] = useState<RunResult | null>(null);
  const [lb, setLb] = useState<RunResult[]>(() => {
    const initial = loadLB();
    return initial.sort((a,b)=> b.sharpe - a.sharpe);
  });

  const onRun = () => {
    const p = {...params};
    const seedRef = p.seed!=null ? {v: Math.max(1, Math.floor(p.seed))} : undefined;

    // simulate many paths, keep average equity curve
    let avg:number[] = [];
    for (let k=0;k<p.paths;k++){
      const path = gbmPath(p.days, p.mu, p.sigma, seedRef && {v: (seedRef.v + k*7919) % 0x7fffffff});
      if (!avg.length) avg = path.slice();
      else for (let i=0;i<avg.length;i++) avg[i] += path[i];
    }
    for (let i=0;i<avg.length;i++) avg[i] /= Math.max(1,p.paths);

    const {sharpe, vol} = annStats(avg, p.rf);
    const mdd = maxDrawdown(avg);

    const res:RunResult = {
      id: Math.random().toString(36).slice(2),
      when: Date.now(),
      user,
      equity: avg,
      sharpe, vol, maxdd: mdd,
      params: p,
    };
    setResult(res);

    // push to leaderboard and persist
    const next = [res, ...lb].sort((a,b)=> b.sharpe - a.sharpe).slice(0,50);
    setLb(next);
    saveLB(next);
  };

  const top10 = lb.slice(0,10);

  return (
    <div style={{display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:12, padding:12}}>
      {/* Left: Simulator */}
      <div className="panel" style={{display:"grid", gridTemplateRows:"auto auto 1fr", gap:10, padding:16}}>
        <div className="panelHeader" style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>Monte Carlo Lab <span className="lux-chip">Interactive</span></div>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <span className="lux-chip">User</span>
            <input className="input" value={user} onChange={e=>setUser(e.target.value)} style={{width:160}} />
            <div className="cta-group">
  <button className="btn-neo-blue" onClick={onRun}>Run Simulation</button>
<a className="btn-neo-red-modern pulse" href="/pricing-labs">Get Pro</a>
  <a className="btn-wire" href="/lab#leaderboard">Leaderboard</a>
</div>

          </div>
        </div>

        {/* Controls */}
        <div className="panelBody" style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
          <label style={{display:"grid", gap:4}}>
            <span>Days</span>
            <input className="num" type="number" min={20} max={2000}
              value={params.days} onChange={e=>setParams({...params, days: clamp(parseInt(e.target.value||"0"), 20, 2000)})}/>
          </label>
          <label style={{display:"grid", gap:4}}>
            <span>μ (annual)</span>
            <input className="num" type="number" step="0.01"
              value={params.mu} onChange={e=>setParams({...params, mu: parseFloat(e.target.value||"0")})}/>
          </label>
          <label style={{display:"grid", gap:4}}>
            <span>σ (annual)</span>
            <input className="num" type="number" step="0.01"
              value={params.sigma} onChange={e=>setParams({...params, sigma: parseFloat(e.target.value||"0")})}/>
          </label>
          <label style={{display:"grid", gap:4}}>
            <span>Paths</span>
            <input className="num" type="number" min={1} max={5000}
              value={params.paths} onChange={e=>setParams({...params, paths: clamp(parseInt(e.target.value||"1"), 1, 5000)})}/>
          </label>
          <label style={{display:"grid", gap:4}}>
            <span>Risk-free (annual)</span>
            <input className="num" type="number" step="0.005"
              value={params.rf} onChange={e=>setParams({...params, rf: parseFloat(e.target.value||"0")})}/>
          </label>
          <label style={{display:"grid", gap:4}}>
            <span>Seed (optional)</span>
            <input className="num" type="number"
              value={params.seed ?? ""} onChange={e=>setParams({...params, seed: e.target.value===""? null : parseInt(e.target.value||"0")})}/>
          </label>
        </div>

        {/* Results */}
        <div className="panelBody" style={{display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:12}}>
          <div className="panel" style={{padding:12}}>
            <div className="panelHeader">Equity Curve (avg path)</div>
            <div className="panelBody" style={{display:"flex", alignItems:"center", justifyContent:"center", height:80}}>
              {result ? <Sparkline data={result.equity}/> : <div style={{opacity:.6}}>Run a simulation to see the curve</div>}
            </div>
          </div>

          <div className="panel" style={{padding:12, display:"grid", gap:8}}>
            <div className="panelHeader">Metrics</div>
            <div className="panelBody" style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8}}>
              <div className="panel" style={{padding:10}}>
                <div style={{opacity:.7, fontSize:12}}>Sharpe</div>
                <div style={{fontWeight:800, fontSize:18}}>{result? fmt2(result.sharpe): "--"}</div>
              </div>
              <div className="panel" style={{padding:10}}>
                <div style={{opacity:.7, fontSize:12}}>Volatility</div>
                <div style={{fontWeight:800, fontSize:18}}>{result? fmtPct(result.vol): "--"}</div>
              </div>
              <div className="panel" style={{padding:10}}>
                <div style={{opacity:.7, fontSize:12}}>Max Drawdown</div>
                <div style={{fontWeight:800, fontSize:18}}>{result? fmtPct(result.maxdd): "--"}</div>
              </div>
            </div>
          </div>

          <div className="panel" style={{gridColumn:"1 / span 2", padding:12}}>
            <div className="panelHeader">AI Mentor (preview)</div>
            <div className="panelBody" style={{display:"grid", gap:8}}>
              <div style={{opacity:.8}}>
                {result ? mentorExplain(result) : "Run a simulation — I’ll analyze your Sharpe, volatility and drawdown and suggest tweaks."}
              </div>
              <div style={{display:"flex", gap:8}}>
                <button className="lux-btn" onClick={()=> result && alert(mentorExplain(result))}>Explain my result</button>
                <button className="lux-outline" onClick={()=> alert("Pro plans unlock deeper mentor answers + code suggestions.")}>What do I unlock?</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Leaderboard + Challenge */}
      <div style={{display:"grid", gap:12}}>
        <div className="panel" style={{padding:12}}>
          <div className="panelHeader">Weekly Challenge <span className="lux-chip">Beat Sharpe 1.2</span></div>
          <div className="panelBody" style={{display:"grid", gap:8}}>
            <div style={{opacity:.8, fontSize:14}}>
              Tune μ and σ to reach Sharpe ≥ 1.20 with max drawdown under 15%.
            </div>
            <div style={{display:"flex", gap:8}}>
              <button className="lux-btn" onClick={onRun}>Try now</button>
              <button className="lux-outline" onClick={()=>{ localStorage.removeItem(LB_KEY); setLb([]); }}>Reset leaderboard</button>
            </div>
          </div>
        </div>

        <div className="panel" style={{padding:12}}>
          <div className="panelHeader">Leaderboard</div>
          <div className="panelBody" style={{display:"grid", gap:6}}>
            {top10.length===0 && <div style={{opacity:.7}}>No runs yet. Be the first!</div>}
            {top10.map((r,i)=>(
              <div key={r.id} style={{display:"grid", gridTemplateColumns:"28px 1fr auto auto", alignItems:"center", gap:8}}>
                <div style={{opacity:.6}}>{i+1}.</div>
                <div style={{overflow:"hidden", textOverflow:"ellipsis"}}>{r.user}</div>
                <div style={{opacity:.85}}>Sharpe <b>{fmt2(r.sharpe)}</b></div>
                <div style={{opacity:.65}}>{new Date(r.when).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{padding:12}}>
          <div className="panelHeader">Upgrade for More</div>
          <div className="panelBody" style={{display:"grid", gap:8}}>
            <div style={{opacity:.8}}>
              Pro unlocks unlimited runs, advanced labs (correlations, VaR/CVaR), mentor deep-dives, and certificate export.
            </div>
            <a className="lux-btn" href="/pricing-labs">See Plans</a>
          </div>
        </div>
      </div>
    </div>
  );
}
