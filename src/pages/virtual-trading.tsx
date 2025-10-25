import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "@theme/Layout";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  UTCTimestamp,
} from "lightweight-charts";
import Paywall from "../components/Paywall";
import { getPlan } from "../lib/plan";

/* ---------------------------
   Types & utils
---------------------------- */
type Bar = { t: number; o: number; h: number; l: number; c: number };
type Series = Bar[];
type Side = "BUY" | "SELL";
type Position = { symbol: string; qty: number; avg: number; mark?: number };
type Trade = { ts: number; symbol: string; side: Side; qty: number; price: number; note?: string };

const COMMON = ["EURUSD","USDJPY","XAUUSD","BTCUSD","ETHUSD","SPX"];
const clamp = (n:number, lo:number, hi:number)=>Math.max(lo, Math.min(hi, n));
function emaArr(src:number[], period:number){ const k=2/(period+1); let p: number|undefined; return src.map(x=> (p=p===undefined?x:p+k*(x-p))); }
function gbmClose(n:number, mu=0.10, sigma=0.22, start=100){ const out=[start]; for(let i=1;i<n;i++){ const z=Math.sqrt(-2*Math.log(Math.random()))*Math.cos(2*Math.PI*Math.random()); const ret=(mu-0.5*sigma*sigma)/252 + sigma*Math.sqrt(1/252)*z; out.push(out[i-1]*Math.exp(ret)); } return out; }
function toCandlesFromClose(close:number[], start=Date.now()-close.length*86400000){ const res:Series=[]; for(let i=0;i<close.length;i++){ const c=close[i]; const o=i===0?c:close[i-1]; const h=Math.max(o,c)*(1+Math.random()*0.004); const l=Math.min(o,c)*(1-Math.random()*0.004); res.push({t:start+i*86400000,o,h,l,c}); } return res; }

/* virtual store (page-local) */
function useVirtualStore(){
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<Trade[]>([]);
  const [lastMarks, setLastMarks] = useState<Record<string, number>>({});
  const markPrice = (symbol:string, price:number)=>{
    setLastMarks(m=>({...m,[symbol]:price}));
    setPositions(prev=>prev.map(p=> p.symbol===symbol? {...p, mark:price} : p));
  };
  const placeMarket = (symbol:string, side:Side, qty:number, price:number, note?:string)=>{
    setHistory(h=>[...h,{ts:Date.now(), symbol, side, qty, price, note}]);
    setPositions(prev=>{
      const p=prev.find(x=>x.symbol===symbol);
      const signed= side==="BUY"? qty : -qty;
      if(!p){
        return [...prev, {symbol, qty:signed, avg:price, mark:lastMarks[symbol]??price}];
      }else{
        const newQty = p.qty + signed;
        if(newQty===0) return prev.filter(x=>x.symbol!==symbol);
        let newAvg = p.avg;
        if ((p.qty>=0 && side==="BUY") || (p.qty<=0 && side==="SELL")){
          const costOld = Math.abs(p.qty)*p.avg;
          const costNew = Math.abs(signed)*price;
          newAvg = (costOld+costNew)/Math.max(1, Math.abs(p.qty)+Math.abs(signed));
        }
        return prev.map(x=> x.symbol===symbol? {...x, qty:newQty, avg:newAvg, mark:lastMarks[symbol]??price}: x);
      }
    });
  };
  return { positions, history, markPrice, placeMarket };
}

/* ---------------------------
   Page
---------------------------- */
export default function VirtualTradingPage(){
  const [plan, setPlan] = useState(getPlan()); // "free" | "pro"
  useEffect(()=>{
    const on = (e:any)=> setPlan(e.detail);
    window.addEventListener("plan:changed", on as any);
    return ()=> window.removeEventListener("plan:changed", on as any);
  }, []);

  const [symbol, setSymbol] = useState("EURUSD");
  const [watch, setWatch] = useState<string[]>(()=> {
    try{ const s = localStorage.getItem("vt:watch"); return s? JSON.parse(s): COMMON; } catch { return COMMON; }
  });
  useEffect(()=> localStorage.setItem("vt:watch", JSON.stringify(watch)), [watch]);

  const [tf, setTf] = useState<"1d"|"4h"|"1h">("1d");
  const [emaFastP, setEmaFastP] = useState(9);
  const [emaSlowP, setEmaSlowP] = useState(21);
  const [qty, setQty] = useState(1);

  // charts
  const [bars, setBars] = useState<Series>(()=> toCandlesFromClose(gbmClose(320)));
  useEffect(()=>{
    const n = tf==="1d"? 320 : tf==="4h"? 520 : 720;
    setBars(toCandlesFromClose(gbmClose(n)));
  }, [symbol, tf]);
  const close = useMemo(()=> bars.map(b=>b.c), [bars]);
  const emaF  = useMemo(()=> emaArr(close, emaFastP), [close, emaFastP]);
  const emaS  = useMemo(()=> emaArr(close, emaSlowP), [close, emaSlowP]);

  const { positions, history, markPrice, placeMarket } = useVirtualStore();
  const last = close.at(-1) ?? 0;
  useEffect(()=> { if(symbol && last) markPrice(symbol, last); }, [symbol, last]);

  const priceRef = useRef<HTMLDivElement|null>(null);
  const priceChart = useRef<IChartApi|null>(null);
  const candleSeries = useRef<ISeriesApi<"Candlestick">|null>(null);
  const emaFastSeries = useRef<ISeriesApi<"Line">|null>(null);
  const emaSlowSeries = useRef<ISeriesApi<"Line">|null>(null);

  useEffect(()=>{
    if(!priceRef.current) return;
    const pc = createChart(priceRef.current, {
      layout:{ background:{color:"#0b1320"}, textColor:"#d2e6ff"},
      grid:{horzLines:{color:"#11243b"}, vertLines:{color:"#11243b"}},
      rightPriceScale:{borderColor:"#1d3559"},
      timeScale:{borderColor:"#1d3559"},
      crosshair:{mode:1},
      width: priceRef.current.clientWidth, height: 360
    });
    priceChart.current = pc;
    candleSeries.current = pc.addCandlestickSeries({
      upColor:"#21e087", downColor:"#ff6b6b",
      borderUpColor:"#21e087", borderDownColor:"#ff6b6b",
      wickUpColor:"#21e087", wickDownColor:"#ff6b6b",
    });
    emaFastSeries.current = pc.addLineSeries({ lineWidth:2, color:"#48fffb" });
    emaSlowSeries.current = pc.addLineSeries({ lineWidth:2, color:"#a472ff" });
    const ro = new ResizeObserver(()=> {
      if(priceChart.current && priceRef.current)
        priceChart.current.applyOptions({ width: priceRef.current.clientWidth });
    });
    ro.observe(priceRef.current);
    return ()=> { ro.disconnect(); priceChart.current?.remove(); priceChart.current=null; };
  }, []);

  useEffect(()=>{
    if(!priceChart.current || !candleSeries.current) return;
    const data = bars.map(b=> ({
      time: Math.floor(b.t/1000) as UTCTimestamp,
      open:b.o, high:b.h, low:b.l, close:b.c
    }));
    candleSeries.current.setData(data);
    if(emaFastSeries.current){
      const lf = emaF.map((v,i)=> ({ time:data[i].time, value:v })) as LineData[];
      emaFastSeries.current.setData(lf);
    }
    if(emaSlowSeries.current){
      const ls = emaS.map((v,i)=> ({ time:data[i].time, value:v })) as LineData[];
      emaSlowSeries.current.setData(ls);
    }
    priceChart.current.timeScale().fitContent();
  }, [bars, emaF, emaS]);

  // trade
  const onBuy = ()=> placeMarket(symbol, "BUY",  qty, last, "Chart");
  const onSell= ()=> placeMarket(symbol, "SELL", qty, last, "Chart");

  const pos = positions.find(p=>p.symbol===symbol);
  const mark = last;
  const pnlAbs = pos ? (mark - pos.avg) * pos.qty : 0;

  // gating knobs
  const isPro = plan === "pro";
  const [showPay, setShowPay] = useState(false);

  const proGuard = (fn: ()=>void)=> {
    if (isPro) return fn();
    setShowPay(true);
  };

  return (
    <Layout title="Virtual Trading" description="Watchlist • Chart • Paper trades • Positions">
      <div style={{maxWidth:1280, margin:"0 auto", padding:"16px"}}>
        {/* Top header */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:12}}>
          <div style={{display:"grid", gap:6}}>
            <div className="lux-chip">{isPro ? "PRO" : "FREE"}</div>
            <h1 style={{margin:0}}>Virtual Trading Desk</h1>
            <div style={{opacity:.82, maxWidth:760}}>
              Trade a synthetic market with EMA(9/21), paper fills, positions and history. Pro unlocks advanced features & exports.
            </div>
          </div>
          <div className="cta-group">
            <a className="btn-ghost-blue" href="/lab">Open Lab</a>
            <a className="btn-neo-red-modern" href="/pricing-labs">Get Pro</a>
          </div>
        </div>

        {/* Main grid */}
        <div style={{display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:12}}>
          {/* Left: chart + ticket */}
          <div className="panel" style={{display:"grid", gap:10, padding:12}}>
            {/* Controls */}
            <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
              <div className="lux-chip">Symbol</div>
              <select className="lux-select" value={symbol} onChange={e=>setSymbol(e.target.value)}>
                {watch.map(s=> <option key={s}>{s}</option>)}
              </select>

              <div className="lux-chip">TF</div>
              {(["1d","4h","1h"] as const).map(t=>(
                <button key={t}
                  className={tf===t? "btn-neo-blue":"btn-ghost-blue"}
                  onClick={()=>setTf(t)}
                >{t}</button>
              ))}

              <div className="lux-chip">EMA</div>
              <input className="num" style={{width:64}} type="number" min={2} max={100}
                value={emaFastP} onChange={e=>setEmaFastP(clamp(parseInt(e.target.value||"1"),2,100))} title="Fast EMA"/>
              <input className="num" style={{width:64}} type="number" min={3} max={300}
                value={emaSlowP} onChange={e=>setEmaSlowP(clamp(parseInt(e.target.value||"1"),3,300))} title="Slow EMA"/>

              {!isPro && (
                <button className="btn-wire" onClick={()=>setShowPay(true)} title="Unlock Pro indicators">
                  Unlock advanced panes
                </button>
              )}
            </div>

            {/* Chart */}
            <div ref={priceRef} style={{width:"100%", height:360}} />

            {/* Ticket */}
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:10}}>
              <div style={{display:"flex", gap:12, alignItems:"baseline"}}>
                <div style={{opacity:.7}}>Last:</div>
                <div style={{fontWeight:800, fontSize:20}}>{last? last.toFixed(2): "--"}</div>
                <div className="lux-chip">EMA9 {emaF.length? emaF.at(-1)!.toFixed(2): "--"}</div>
                <div className="lux-chip">EMA21 {emaS.length? emaS.at(-1)!.toFixed(2): "--"}</div>
              </div>

              <div style={{display:"flex", gap:8, alignItems:"center"}}>
                <span style={{opacity:.7}}>Qty</span>
                <input className="num" style={{width:64}} type="number" min={1} max={1000}
                  value={qty} onChange={e=>setQty(clamp(parseInt(e.target.value||"1"),1,1000))}/>
                <button className="lux-btn" onClick={onBuy}>Buy @ {last? last.toFixed(2): "--"}</button>
                <button className="lux-outline danger" onClick={onSell}>Sell @ {last? last.toFixed(2): "--"}</button>
              </div>
            </div>

            {/* Position summary */}
            <div className="panel" style={{padding:10, display:"flex", gap:16, alignItems:"baseline"}}>
              <div className="lux-chip">{symbol}</div>
              <div>Pos: <b>{pos? pos.qty: 0}</b></div>
              <div>Avg: <b>{pos && pos.qty!==0 ? pos.avg.toFixed(2): "--"}</b></div>
              <div>Mark: <b>{last? last.toFixed(2): "--"}</b></div>
              <div>uPnL: <b style={{color: pnlAbs>=0? "#21e087":"#ff6b6b"}}>{pnlAbs.toFixed(2)}</b></div>
              <div style={{marginLeft:"auto"}}>
                <button className="btn-ghost-blue" onClick={()=> proGuard(()=> alert("Exported! (stub)"))}>
                  Export CSV (Pro)
                </button>
              </div>
            </div>
          </div>

          {/* Right: watchlist + positions + history */}
          <div style={{display:"grid", gap:12, alignContent:"start"}}>
            {/* Watchlist */}
            <div className="panel" style={{padding:12}}>
              <div className="panelHeader">Watchlist</div>
              <div className="panelBody" style={{display:"grid", gap:8}}>
                {watch.map(s=>(
                  <div key={s} style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <button className={symbol===s? "btn-neo-blue":"btn-ghost-blue"} onClick={()=>setSymbol(s)}>{s}</button>
                    <button className="lux-ghost" onClick={()=> setWatch(w=> w.filter(x=>x!==s))}>Remove</button>
                  </div>
                ))}
                <div style={{display:"flex", gap:6}}>
                  <input id="symIn" className="input" placeholder="Add symbol (e.g. BTCUSD)"/>
                  <button className="lux-btn" onClick={()=>{
                    const el = document.getElementById("symIn") as HTMLInputElement;
                    const s = (el?.value||"").toUpperCase().replace(/\s+/g,"");
                    if(s && !watch.includes(s)) setWatch(w=>[...w, s]);
                    if(el) el.value="";
                  }}>Add</button>
                </div>
                <div style={{opacity:.7, fontSize:12}}>Client-side list (localStorage).</div>
              </div>
            </div>

            {/* Positions */}
            <div className="panel" style={{padding:12}}>
              <div className="panelHeader">Positions</div>
              <div className="panelBody" style={{display:"grid", gap:6, fontFamily:"ui-monospace, monospace", fontSize:13}}>
                {positions.length===0 && <div style={{opacity:.7}}>No positions.</div>}
                {positions.map(p=>{
                  const mark = p.mark ?? p.avg;
                  const pnl = (mark - p.avg) * p.qty;
                  return (
                    <div key={p.symbol} style={{display:"grid", gridTemplateColumns:"80px 1fr 1fr 1fr 1fr", gap:8}}>
                      <div style={{opacity:.7}}>{p.symbol}</div>
                      <div>qty {p.qty}</div>
                      <div>avg {p.avg.toFixed(2)}</div>
                      <div>mark {mark.toFixed(2)}</div>
                      <div style={{color: pnl>=0? "#21e087":"#ff6b6b"}}>PnL {pnl.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* History */}
            <div className="panel" style={{padding:12}}>
              <div className="panelHeader">Trade History</div>
              <div className="panelBody" style={{display:"grid", gap:6, fontFamily:"ui-monospace, monospace", fontSize:13}}>
                {history.length===0 && <div style={{opacity:.7}}>No trades yet.</div>}
                {history.slice(-14).reverse().map((t,i)=>(
                  <div key={i} style={{display:"grid", gridTemplateColumns:"120px 70px 1fr", gap:8}}>
                    <div style={{opacity:.7}}>{new Date(t.ts).toLocaleDateString()}</div>
                    <div style={{color: t.side==="BUY"? "#21e087":"#ff6b6b", fontWeight:800}}>{t.side}</div>
                    <div>{t.symbol} @ {t.price.toFixed(2)} (qty {t.qty})</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upgrade card */}
            {!isPro && (
              <div className="panel" style={{padding:12}}>
                <div className="panelHeader">Upgrade for More</div>
                <div className="panelBody" style={{display:"grid", gap:8}}>
                  <div style={{opacity:.85}}>
                    Pro unlocks advanced panes (RSI/MACD), unlimited experiments, exports, leaderboards & certificates.
                  </div>
                  <a className="btn-neo-red-modern" href="/pricing-labs">See Plans</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Paywall open={showPay} onClose={()=>setShowPay(false)} />
    </Layout>
  );
}
