// src/pages/lab.tsx
import React, {useEffect, useMemo, useRef, useState} from "react";
import Layout from "@theme/Layout";
import ClientOnly from "../components/ClientOnly";

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

/* ========= Simple Chart with Axes (SVG) ========= */
function niceTicks(min:number, max:number, count=5){
  if (min===max) return Array.from({length:count}, (_,i)=>min);
  const span = max - min;
  const step = Math.pow(10, Math.floor(Math.log10(span/count)));
  const err = (count * step)/span;
  const mult = err <= 0.5 ? 2 : err <= 1 ? 1 : 5;
  const niceStep = step * (mult===1?1:mult===2?2:5);
  const niceMin = Math.floor(min/niceStep)*niceStep;
  const niceMax = Math.ceil(max/niceStep)*niceStep;
  const ticks = [];
  for (let v=niceMin; v<=niceMax+1e-9; v+=niceStep) ticks.push(v);
  return ticks;
}

function EquityChart({data, w=420, h=180, yLabel="Equity (x)"}:{data:number[]; w?:number; h?:number; yLabel?:string}){
  if (!data || data.length<2) return <div style={{height:h}}/>;
  const m = {l:48, r:12, t:10, b:22};
  const innerW = w - m.l - m.r;
  const innerH = h - m.t - m.b;
  const xmin=0, xmax=data.length-1;
  const ymin = Math.min(...data), ymax = Math.max(...data);

  const x = (i:number)=> m.l + (i - xmin) / (xmax - xmin) * innerW;
  const y = (v:number)=> m.t + (1 - (v - ymin) / (ymax - ymin || 1)) * innerH;

  const path = data.map((v,i)=> (i===0?`M ${x(i)} ${y(v)}` : `L ${x(i)} ${y(v)}`)).join(" ");

  const yTicks = niceTicks(ymin, ymax, 5);
  const xTicks = niceTicks(xmin, xmax, 5);

  const up = data[data.length-1] >= data[0];

  return (
    <svg width={w} height={h} style={{display:"block"}}>
      {/* grid */}
      {yTicks.map((t,idx)=>(
        <line key={"gy"+idx} x1={m.l} x2={w-m.r} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.08)" strokeWidth={1}/>
      ))}
      {xTicks.map((t,idx)=>(
        <line key={"gx"+idx} x1={x(t)} x2={x(t)} y1={m.t} y2={h-m.b} stroke="rgba(255,255,255,0.06)" strokeWidth={1}/>
      ))}

      {/* axes */}
      <line x1={m.l} x2={m.l} y1={m.t} y2={h-m.b} stroke="rgba(255,255,255,0.35)" />
      <line x1={m.l} x2={w-m.r} y1={h-m.b} y2={h-m.b} stroke="rgba(255,255,255,0.35)" />

      {/* tick labels */}
      {yTicks.map((t,idx)=>(
        <text key={"ty"+idx} x={m.l-6} y={y(t)} textAnchor="end" dy="0.32em" fontSize="10" fill="#cfd8e3">{t.toFixed(2)}</text>
      ))}
      {xTicks.map((t,idx)=>(
        <text key={"tx"+idx} x={x(t)} y={h-m.b+12} textAnchor="middle" fontSize="10" fill="#cfd8e3">{t.toFixed(0)}</text>
      ))}

      {/* label */}
      <text x={m.l-36} y={m.t+10} transform={`rotate(-90 ${m.l-36} ${m.t+10})`} fontSize="10" fill="#cfd8e3">{yLabel}</text>

      {/* series */}
      <path d={path} fill="none" stroke={up?"#21e087":"#ff6b6b"} strokeWidth={2}/>
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

/* ========= Guide Tip ========= */
function GuideTip({title, children}:{title:string; children:React.ReactNode}){
  const [open,setOpen] = useState(false);
  return (
    <div style={{position:"relative", display:"inline-block"}}>
      <button className="helptip-btn" aria-label={`Help: ${title}`} onClick={()=>setOpen(!open)}>?</button>
      {open && (
        <div className="helptip-pop modern" role="dialog" style={{position:"absolute", top:"110%", right:0, zIndex:10}}>
          <div className="helptip-title">{title}</div>
          <div className="helptip-body">{children}</div>
        </div>
      )}
    </div>
  );
}

/* ========= Activity Log (for Monitoring) ========= */
function useActivityLog(){
  const [lines, setLines] = useState<string[]>([]);
  const log = (s:string) => setLines(prev => [new Date().toLocaleTimeString()+": "+s, ...prev].slice(0,80));
  return {lines, log};
}

/* ========= Multiline Python-like Terminal ========= */
type TermLine = { text:string; kind:"in"|"out"|"sys"|"err" };

function Terminal({
  params, setParams, onRun, lastResult, onPro, onInfo, log
}:{
  params: SimParams;
  setParams: (p:SimParams)=>void;
  onRun: ()=>void;
  lastResult: RunResult | null;
  onPro: ()=>void;
  onInfo: ()=>void;
  log: (s:string)=>void;
}){
  const [history, setHistory] = useState<TermLine[]>([
    {kind:"sys", text:"PyTerm v2 · multiline editor · Shift+Enter=newline · Enter/Ctrl+Enter=run · type 'help'"}
  ]);
  const [code, setCode] = useState<string>([
    "# Examples:",
    "set mu 0.12",
    "set sigma 0.18",
    "set paths 1000",
    "run",
    "stats"
  ].join("\n"));
  const boxRef = useRef<HTMLDivElement>(null);
  const push = (t:TermLine) => setHistory(h => [...h, t]);
  useEffect(()=>{ boxRef.current?.scrollTo({top: boxRef.current.scrollHeight}); }, [history]);

  function printHelp(){
    push({kind:"out", text:
`Commands:
  help                       Show this help
  run                        Run simulation
  set <k> <v>                Set param (days, mu, sigma, paths, rf, seed)
  stats                      Print last Sharpe / Vol / MaxDD
  params                     Show current parameters
  repeat <n> <cmd>           Repeat a command n times (e.g., repeat 5 run)
  clear                      Clear terminal
  pro                        See Pro features
  info                       Show guided tips

Multiline scripts: each line is a command. Enter/Ctrl+Enter executes them all.`});
  }

  function execOne(cmd:string){
    const [c, ...rest] = cmd.trim().split(/\s+/);
    if (!c) return;

    if (c==="help"){ printHelp(); }
    else if (c==="clear"){ setHistory([]); }
    else if (c==="params"){ push({kind:"out", text: JSON.stringify(params, null, 2)}); }
    else if (c==="set"){
      const [k, vRaw] = rest;
      if(!k || vRaw===undefined){ push({kind:"err", text:"Usage: set <key> <value>"}); return;}
      const num = vRaw === "null" ? null : Number(vRaw);
      if(["days","mu","sigma","paths","rf","seed"].includes(k)){
        const next = {...params} as any;
        next[k] = (k==="seed") ? (num as any) : Number(num);
        setParams(next);
        push({kind:"out", text:`ok: ${k} = ${next[k]}`});
      } else {
        push({kind:"err", text:`Unknown key '${k}'`});
      }
    }
    else if (c==="run"){ onRun(); push({kind:"out", text:"running…"}); }
    else if (c==="stats"){
      if(!lastResult){ push({kind:"err", text:"No result yet. Type 'run'"}); }
      else {
        push({kind:"out", text:`Sharpe=${fmt2(lastResult.sharpe)}  Vol=${fmtPct(lastResult.vol)}  MaxDD=${fmtPct(lastResult.maxdd)}`});
      }
    }
    else if (c==="repeat"){
      const n = Number(rest[0]);
      const sub = rest.slice(1).join(" ");
      if (!Number.isFinite(n) || n<=0 || !sub){ push({kind:"err", text:"Usage: repeat <n> <cmd>"}); return; }
      for (let i=0;i<n;i++){ execOne(sub); }
    }
    else if (c==="pro"){ onPro(); push({kind:"out", text:"Opening Pro plans…"}); }
    else if (c==="info"){ onInfo(); push({kind:"out", text:"Showing guided tips…"}); }
    else { push({kind:"err", text:`Unknown command '${c}'. Type 'help'.`}); }
  }

  function executeAll(){
    const lines = code.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    if (lines.length===0) return;
    push({kind:"in", text:">>>\n"+lines.join("\n")});
    for (const line of lines){ execOne(line); }
    log(`Terminal executed ${lines.length} cmd(s)`);
  }

  function onKey(e:React.KeyboardEvent<HTMLTextAreaElement>){
    if ((e.key==="Enter" && (e.ctrlKey || e.metaKey)) || (e.key==="Enter" && !e.shiftKey)) {
      e.preventDefault();
      executeAll();
    }
  }

  return (
    <div className="panel" style={{padding:12, display:"grid", gridTemplateRows:"auto auto 1fr auto", gap:8}}>
      <div className="cardHeader">
        <div className="cardTitle">Python Terminal</div>
        <div className="cardKicker">multiline · scripts · repeat</div>
      </div>

      <div className="vm-pre" style={{maxHeight:160, overflow:"auto"}} ref={boxRef}>
        {history.map((l, i)=>(
          <div key={i} style={{whiteSpace:"pre-wrap", opacity:l.kind==="sys"?0.8:1, color: l.kind==="err"?"#ff8e9a": l.kind==="in"?"#bde8ff":"#e9f3ff"}}>
            {l.text}
          </div>
        ))}
      </div>

      <textarea
        className="vm-pre"
        style={{minHeight:90, maxHeight:140, overflow:"auto"}}
        value={code}
        onChange={e=>setCode(e.target.value)}
        onKeyDown={onKey}
        placeholder={`# Type multiple commands, e.g.
set mu 0.12
set sigma 0.18
set paths 1000
run
stats`}
      />

      <div className="cta-group" style={{marginTop:6}}>
        <button className="btn-neo-blue" onClick={executeAll}>Run (Enter/Ctrl+Enter)</button>
        <a className="btn-wire" onClick={()=>printHelp()}>Help</a>
        <a className="btn-ghost-blue" onClick={()=>execOne("pro")}>Get Pro</a>
      </div>
    </div>
  );
}

/* ========= Main App ========= */
function LabDashboardApp() {
  // username persisted for leaderboard
  const [user, setUser] = useState<string>(() => localStorage.getItem("lab:user") || "Guest");
  useEffect(()=>localStorage.setItem("lab:user", user), [user]);

  // params
  const [params, setParams] = useState<SimParams>({
    start: 10000, days: 252, mu: 0.10, sigma: 0.20, paths: 200, rf: 0.02, seed: null
  });

  // results & state
  const [result, setResult] = useState<RunResult | null>(null);
  const [lb, setLb] = useState<RunResult[]>(() => {
    const initial = loadLB();
    return initial.sort((a,b)=> b.sharpe - a.sharpe);
  });

  const activity = useActivityLog();
  const [showHints, setShowHints] = useState(false);

  const onRun = () => {
    const p = {...params};
    const seedRef = p.seed!=null ? {v: Math.max(1, Math.floor(p.seed))} : undefined;

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

    const next = [res, ...lb].sort((a,b)=> b.sharpe - a.sharpe).slice(0,50);
    setLb(next);
    saveLB(next);

    activity.log(`Run: Sharpe ${fmt2(sharpe)}, Vol ${fmtPct(vol)}, MaxDD ${fmtPct(mdd)}`);
  };

  const top10 = lb.slice(0,10);

  const perfIndicator = useMemo(()=>{
    if(!result) return "—";
    const s = result.sharpe;
    return s>=1.5 ? "Elite" : s>=1.2 ? "Strong" : s>=0.8 ? "Okay" : "Needs work";
  }, [result]);

  return (
    <div style={{display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:12, padding:12}}>
      {/* Left: Simulator + Terminal */}
      <div className="panel" style={{display:"grid", gridTemplateRows:"auto auto auto 1fr", gap:10, padding:16}}>
        <div className="panelHeader" style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <div>Monte Carlo Lab <span className="lux-chip">Interactive</span></div>
            <GuideTip title="What is this lab?">
              Run Monte Carlo experiments for equity curves. Tweak <code>μ</code> (return) & <code>σ</code> (vol) and compare results.
            </GuideTip>
          </div>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <span className="lux-chip">User</span>
            <input className="input" value={user} onChange={e=>setUser(e.target.value)} style={{width:160}} />
            <div className="cta-group">
              <button className="btn-neo-blue" onClick={onRun}>Run Simulation</button>
              <a className="btn-neo-red-modern pulse" href="/pricing-labs">Get Pro</a>
              <a className="btn-wire" href="#leaderboard">Leaderboard</a>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="panelBody" style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
          <label style={{display:"grid", gap:4}}>
            <span>Days</span>
            <div style={{display:"grid", gridTemplateColumns:"1fr auto", gap:6}}>
              <input className="num" type="number" min={20} max={2000}
                value={params.days} onChange={e=>setParams({...params, days: clamp(parseInt(e.target.value||"0"), 20, 2000)})}/>
              <GuideTip title="Days">Trading days (252 ≈ 1y).</GuideTip>
            </div>
          </label>
          <label style={{display:"grid", gap:4}}>
            <span>μ (annual)</span>
            <div style={{display:"grid", gridTemplateColumns:"1fr auto", gap:6}}>
              <input className="num" type="number" step="0.01"
                value={params.mu} onChange={e=>setParams({...params, mu: parseFloat(e.target.value||"0")})}/>
              <GuideTip title="μ (return)">Expected annualized return.</GuideTip>
            </div>
          </label>
          <label style={{display:"grid", gap:4}}>
            <span>σ (annual)</span>
            <div style={{display:"grid", gridTemplateColumns:"1fr auto", gap:6}}>
              <input className="num" type="number" step="0.01"
                value={params.sigma} onChange={e=>setParams({...params, sigma: parseFloat(e.target.value||"0")})}/>
              <GuideTip title="σ (volatility)">Annualized volatility.</GuideTip>
            </div>
          </label>
          <label style={{display:"grid", gap:4}}>
            <span>Paths</span>
            <div style={{display:"grid", gridTemplateColumns:"1fr auto", gap:6}}>
              <input className="num" type="number" min={1} max={5000}
                value={params.paths} onChange={e=>setParams({...params, paths: clamp(parseInt(e.target.value||"1"), 1, 5000)})}/>
              <GuideTip title="Paths">Number of scenarios.</GuideTip>
            </div>
          </label>
          <label style={{display:"grid", gap:4}}>
            <span>Risk-free (annual)</span>
            <div style={{display:"grid", gridTemplateColumns:"1fr auto", gap:6}}>
              <input className="num" type="number" step="0.005"
                value={params.rf} onChange={e=>setParams({...params, rf: parseFloat(e.target.value||"0")})}/>
              <GuideTip title="Risk-free rate">Used in Sharpe.</GuideTip>
            </div>
          </label>
          <label style={{display:"grid", gap:4}}>
            <span>Seed (optional)</span>
            <div style={{display:"grid", gridTemplateColumns:"1fr auto", gap:6}}>
              <input className="num" type="number"
                value={params.seed ?? ""} onChange={e=>setParams({...params, seed: e.target.value===""? null : parseInt(e.target.value||"0")})}/>
              <GuideTip title="Seed">Reproducible runs.</GuideTip>
            </div>
          </label>
        </div>

        {/* Terminal */}
        <Terminal
          params={params}
          setParams={setParams}
          onRun={onRun}
          lastResult={result}
          onPro={()=>{ window.location.href="/pricing-labs"; }}
          onInfo={()=> setShowHints(true)}
          log={activity.log}
        />

        {/* Results / Chart + Metrics + Model */}
        <div className="panelBody" style={{display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:12}}>
          <div className="panel" style={{padding:12}}>
            <div className="panelHeader" style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <span>Equity Curve (avg path)</span>
              <GuideTip title="Equity Chart">Axis ticks + grid for quick reading.</GuideTip>
            </div>
            <div className="panelBody" style={{display:"flex", alignItems:"center", justifyContent:"center"}}>
              {result ? <EquityChart data={result.equity} w={460} h={200}/> : <div style={{opacity:.6}}>Run a simulation to see the curve</div>}
            </div>
          </div>

          <div className="panel" style={{padding:12, display:"grid", gap:8}}>
            <div className="panelHeader" style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <span>Metrics</span>
              <GuideTip title="Metrics">Sharpe (risk-adjusted), Vol (annualized σ), MaxDD.</GuideTip>
            </div>
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

          {/* MC Formula / Model */}
          <div className="panel" style={{gridColumn:"1 / span 2", padding:12}}>
            <div className="panelHeader" style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <span>Monte-Carlo Model (GBM)</span>
              <GuideTip title="Model">
                Geometric Brownian Motion (GBM) with Euler–Maruyama discretization for daily steps.
              </GuideTip>
            </div>
            <div className="panelBody" style={{display:"grid", gap:8}}>
              <div className="vm-pre" style={{whiteSpace:"pre-wrap"}}>
{`Stochastic differential equation (SDE):
  dS_t = μ S_t dt + σ S_t dW_t

Closed-form (lognormal) solution:
  S_t = S_0 · exp( (μ - ½σ²) t + σ W_t )

Discrete (Euler) daily step (Δt = 1/252):
  S_{t+Δt} = S_t · exp( (μ - ½σ²)Δt + σ√Δt · Z ),  Z ~ N(0,1)`}
              </div>
              <div className="cta-group">
                <button className="btn-ghost-blue" onClick={()=>alert("Pro: switch to antithetic or quasi-random sampling, add drift regimes, correlations, VaR/CVaR.")}>
                  Pro Variants
                </button>
                <a className="btn-neo-red-modern" href="/pricing-labs">Unlock Pro Models</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Monitoring + Leaderboard + Challenge */}
      <div style={{display:"grid", gap:12}}>
        {/* Monitoring */}
        <div className="panel" style={{padding:12}}>
          <div className="panelHeader" style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <span>Monitoring</span>
            <GuideTip title="Monitoring">KPIs & activity log update after each run.</GuideTip>
          </div>
          <div className="panelBody" style={{display:"grid", gap:10}}>
            <div className="row3">
              <div className="stat"><h6>Performance</h6><b>{perfIndicator}</b></div>
              <div className="stat"><h6>Last Sharpe</h6><b>{result? fmt2(result.sharpe): "—"}</b></div>
              <div className="stat"><h6>MaxDD</h6><b>{result? fmtPct(result.maxdd): "—"}</b></div>
            </div>
            <div className="graphDrawer">
              {result ? <EquityChart data={result.equity} w={360} h={140}/> : <div style={{opacity:.6}}>Awaiting run…</div>}
            </div>
            <div className="vm-pre" style={{maxHeight:140, overflow:"auto"}}>
              {activity.lines.length===0 ? <div style={{opacity:.7}}>No activity yet.</div> :
                activity.lines.map((l,i)=>(<div key={i}>{l}</div>))}
            </div>
            <div className="btn-row">
              <button className="btnGold" onClick={()=>{ activity.log("Snapshot export (Pro)"); alert("Pro feature: Export PNG/PDF"); }}>Export Snapshot</button>
              <button className="btnGhost" onClick={()=>{ setShowHints(v=>!v); }}>Toggle Guides</button>
              <button className="btnOutline" onClick={()=>{ localStorage.removeItem(LB_KEY); window.location.reload(); }}>Factory Reset</button>
            </div>
          </div>
        </div>

        {/* Challenge */}
        <div className="panel" style={{padding:12}}>
          <div className="panelHeader" style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <span>Weekly Challenge <span className="lux-chip">Beat Sharpe 1.2</span></span>
            <GuideTip title="Weekly Challenge">Great for demos and team trials.</GuideTip>
          </div>
          <div className="panelBody" style={{display:"grid", gap:8}}>
            <div style={{opacity:.8, fontSize:14}}>
              Tune μ and σ to reach Sharpe ≥ 1.20 with max drawdown under 15%.
            </div>
            <div className="btn-row">
              <button className="btn-neo-blue" onClick={onRun}>Try now</button>
              <button className="btn-ghost-blue" onClick={()=>{ localStorage.removeItem(LB_KEY); activity.log("Leaderboard reset."); setLb([]); }}>Reset leaderboard</button>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div id="leaderboard" className="panel" style={{padding:12}}>
          <div className="panelHeader" style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <span>Leaderboard</span>
            <GuideTip title="Leaderboard">Pro syncs team-wide & issues certificates.</GuideTip>
          </div>
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
          <div className="cta-group" style={{marginTop:10}}>
            <a className="btn-neo-red-modern pulse" href="/pricing-labs">Get Pro — Team Leaderboards</a>
          </div>
        </div>
      </div>

      {/* Optional overlay for hints */}
      {showHints && (
        <div style={{
          position:"fixed", inset:0, zIndex:9, pointerEvents:"none",
          background:"radial-gradient(1200px 800px at 50% 20%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.85) 100%)"
        }}/>
      )}
    </div>
  );
}

export default function LabDashboardPage() {
  return (
    <Layout title="Lab Dashboard" description="Monte Carlo Lab with leaderboard">
      <ClientOnly fallback={<div style={{ padding: 24 }}>Loading…</div>}>
        {() => <LabDashboardApp />}
      </ClientOnly>
    </Layout>
  );
}
