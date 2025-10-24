import React, { useMemo, useState } from "react";

/** Props: pass live spot S if you have it (optional) */
export default function VirtualMonitoring({ S }: { S?: number }) {
  const [sigma, setSigma] = useState(0.25); // vol
  const [r, setR] = useState(0.02); // rf
  const [K, setK] = useState(100);
  const [T, setT] = useState(0.5);

  const spot = Number.isFinite(S) ? (S as number) : 100;

  const { d1, d2, call, bbMid } = useMemo(() => {
    const s = Math.max(1e-6, spot);
    const vol = Math.max(1e-6, sigma);
    const d1 =
      (Math.log(s / K) + (r + 0.5 * vol * vol) * T) / (vol * Math.sqrt(T));
    const d2 = d1 - vol * Math.sqrt(T);

    // crude normal CDF
    const N = (x: number) =>
      0.5 * (1 + Math.erf(x / Math.SQRT2));

    const call = s * N(d1) - K * Math.exp(-r * T) * N(d2);

    // toy Bollinger mid (ema-like)
    const bbMid = 0.7 * s + 0.3 * K;

    return { d1, d2, call, bbMid };
  }, [spot, sigma, r, K, T]);

  return (
    <div
      className="panel"
      style={{
        padding: 14,
        background: "linear-gradient(180deg,#0b1320,#0d1629)",
        border: "1px solid #13304f",
      }}
    >
      <div className="panelHeader">Virtual Monitoring</div>

      <div className="panelBody" style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <L k="Spot" v={spot.toFixed(2)} />
          <L k="Strike" v={K.toFixed(2)} />
          <L k="Vol (σ)" v={(sigma * 100).toFixed(1) + "%"} />
          <L k="Tenor (T)" v={T.toFixed(2) + "y"} />
          <L k="Rate (r)" v={(r * 100).toFixed(1) + "%"} />
        </div>

        <div className="hint-box">
          <div style={{ opacity: 0.85, marginBottom: 4 }}>
            Black–Scholes (Call) – quick intuition
          </div>
          <div style={{ opacity: 0.75, fontSize: 12 }}>
            \( d_1 = \frac{\ln(S/K) + (r + \sigma^2/2)T}{\sigma\sqrt{T}}, \quad
            d_2 = d_1 - \sigma\sqrt{T} \).
            Call ≈ \(S \cdot N(d_1) - K e^{-rT} N(d_2)\).
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <L k="d₁" v={d1.toFixed(3)} />
          <L k="d₂" v={d2.toFixed(3)} />
          <L k="BS Call (≈)" v={call.toFixed(2)} />
          <L k="BB Mid (toy)" v={bbMid.toFixed(2)} />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>
            Strike
            <input
              className="num"
              type="number"
              value={K}
              onChange={(e) => setK(parseFloat(e.target.value || "0"))}
            />
          </label>
          <label>
            Vol (σ)
            <input
              className="num"
              type="number"
              step="0.01"
              value={sigma}
              onChange={(e) => setSigma(parseFloat(e.target.value || "0"))}
            />
          </label>
          <label>
            Tenor (years)
            <input
              className="num"
              type="number"
              step="0.1"
              value={T}
              onChange={(e) => setT(parseFloat(e.target.value || "0"))}
            />
          </label>
          <label>
            Rate r
            <input
              className="num"
              type="number"
              step="0.005"
              value={r}
              onChange={(e) => setR(parseFloat(e.target.value || "0"))}
            />
          </label>
        </div>

        <div style={{ fontSize: 12, opacity: 0.75 }}>
          Tip: Hook this panel to the chart via <code>&lt;VirtualMonitoring S=&#123;lastPrice&#125; /&gt;</code> to
          see the Greeks-like intuition react in real time.
        </div>
      </div>
    </div>
  );
}

function L({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div style={{ opacity: 0.7, fontSize: 12 }}>{k}</div>
      <div style={{ fontWeight: 800 }}>{v}</div>
    </div>
  );
}
