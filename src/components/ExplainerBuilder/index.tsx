import React, { useMemo, useState } from "react";

export default function ExplainerBuilder() {
  const [model, setModel] = useState("Black-Scholes (Call)");
  const [S, setS] = useState(100);
  const [K, setK] = useState(100);
  const [r, setR] = useState(2);
  const [sigma, setSigma] = useState(20);
  const [T, setT] = useState(0.25);
  const [emaF, setEmaF] = useState(12);
  const [emaS, setEmaS] = useState(26);
  const [closes, setCloses] = useState("101,102,99,100,103,104,105,103,102,101");

  const HUB = "https://asraelx-knowledge-hub.netlify.app";
  const SKEW = `${HUB}/finance/skew-smile`;
  const VM = `${HUB}/finance/virtual-monitoring`;

  const md = useMemo(() => {
    const params =
      model === "Black-Scholes (Call)"
        ? `- S=${S}, K=${K}, r=${r}%, σ=${sigma}%, T=${T}y`
        : model === "Bollinger Mid"
        ? `- closes: [${closes}]`
        : model === "EMA Fair Value"
        ? `- S=${S}, EMA_fast=${emaF}, EMA_slow=${emaS}`
        : `- S=${S}, K=${K}, r=${r}%, σ=${sigma}% (+skew), T=${T}y`;

    const details =
      model === "Black-Scholes (Call)"
        ? "We apply the closed-form solution: `C = S·N(d1) − K·e^{−rT}·N(d2)`."
        : model === "Bollinger Mid"
        ? "We use SMA as baseline and ±2σ bands for context."
        : model === "EMA Fair Value"
        ? "We anchor to the midpoint of fast/slow EMAs via α=2/(n+1)."
        : "We proxy smile by adjusting σ with moneyness (educational).";

    return [
      `### Virtual Price (${model})`,
      "",
      "**Inputs:**",
      params,
      "",
      details,
      "",
      "> Model-based, non-binding indication (for discourse).",
      "",
      `**Learn more:** [Skew/Smile](${SKEW}) • [Virtual Monitoring](${VM})`,
      ""
    ].join("\n");
  }, [model, S, K, r, sigma, T, emaF, emaS, closes]);

  const html = useMemo(
    () =>
      md
        .replace(/^### (.*)$/m, "<h3>$1</h3>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\n\n/g, "<br/><br/>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>'),
    [md]
  );

  const copy = async (txt: string) => { try { await navigator.clipboard.writeText(txt); } catch {} };

  return (
    <div className="vm-card">
      <div className="vm-row">
        <select value={model} onChange={(e)=>setModel(e.target.value)}>
          <option>Black-Scholes (Call)</option>
          <option>Bollinger Mid</option>
          <option>EMA Fair Value</option>
          <option>Skew/Smile (beta)</option>
        </select>
      </div>

      {model==="Black-Scholes (Call)" && (
        <div className="vm-grid">
          <label>S<input type="number" value={S} onChange={e=>setS(parseFloat(e.target.value||"0"))}/></label>
          <label>K<input type="number" value={K} onChange={e=>setK(parseFloat(e.target.value||"0"))}/></label>
          <label>r %<input type="number" value={r} onChange={e=>setR(parseFloat(e.target.value||"0"))}/></label>
          <label>σ %<input type="number" value={sigma} onChange={e=>setSigma(parseFloat(e.target.value||"0"))}/></label>
          <label>T (y)<input type="number" value={T} onChange={e=>setT(parseFloat(e.target.value||"0"))}/></label>
        </div>
      )}

      {model==="Bollinger Mid" && (
        <div className="vm-row">
          <label style={{width:"100%"}}>
            Closes (CSV)
            <textarea rows={2} value={closes} onChange={e=>setCloses(e.target.value)} />
          </label>
        </div>
      )}

      {model==="EMA Fair Value" && (
        <div className="vm-grid">
          <label>S<input type="number" value={S} onChange={e=>setS(parseFloat(e.target.value||"0"))}/></label>
          <label>EMA Fast<input type="number" value={emaF} onChange={e=>setEmaF(parseInt(e.target.value||"0")||0)}/></label>
          <label>EMA Slow<input type="number" value={emaS} onChange={e=>setEmaS(parseInt(e.target.value||"0")||0)}/></label>
        </div>
      )}

      <div className="vm-actions">
        <button className="btnGold" onClick={()=>copy(md)}>Copy Markdown</button>
        <button className="btnOutline" onClick={()=>copy(html)}>Copy HTML</button>
        <a className="btnGhost" href="https://asraelx-knowledge-hub.netlify.app/finance/virtual-monitoring" target="_blank" rel="noreferrer">Open Doc ↗</a>
      </div>

      <details style={{marginTop:10}}>
        <summary><b>Preview (Markdown)</b></summary>
        <pre className="vm-pre">{md}</pre>
      </details>
    </div>
  );
}
