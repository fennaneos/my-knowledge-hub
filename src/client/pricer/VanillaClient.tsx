import React, { useState, useEffect, useMemo } from "react";
import Layout from "@theme/Layout";
import Plot from "../../components/PlotNoSSR"
import { bs } from "../../utils/bsMath";
import { GoldBox } from "../../components/GoldBox";
import { TradingViewWidget } from "../../components/TradingViewWidget";
import { GreeksChart } from "../../components/GreeksChart";

import { SymbolDropdown } from "../../components/SymbolDropdown";


import { InfoBox } from "../../components/InfoBox";


import ClientOnly from "../../components/ClientOnly";






export default function VanillaClient() {
  /* ---------------------- State ---------------------- */
  const [symbol, setSymbol] = useState("AAPL");
  const [S, setS] = useState(260);
  const [K, setK] = useState(260);
  const [r, setR] = useState(0.05);
  const [q, setQ] = useState(0.005);
  const [sigma, setSigma] = useState(0.25);
  const [T, setT] = useState(0.5);
  const [isCall, setIsCall] = useState(true);

  const [price, setPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(false);

  // sync status
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const API_BASE =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:8888/.netlify/functions"
      : "/.netlify/functions";

  /* ---------------------- Fetch market params ---------------------- */
  async function loadMarket() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/quote?symbol=${encodeURIComponent(symbol)}`);
      const q = await res.json();
      if (q.error) throw new Error(q.error);
      if (q.price) setS(q.price);
      if (q.dividendYield) setQ(q.dividendYield);
      setPrice(q.price);
      setLastUpdate(Date.now());
    } catch (e: any) {
      setError(e.message || "Could not load market params.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!autoSync) return;
    loadMarket();
    const interval = setInterval(loadMarket, 30000);
    return () => clearInterval(interval);
  }, [autoSync, symbol]);

  /* ---------------------- Live Sync Indicator ---------------------- */
  const [timeAgo, setTimeAgo] = useState("—");
  useEffect(() => {
    const update = () => {
      if (!lastUpdate) return setTimeAgo("—");
      const diff = Math.floor((Date.now() - lastUpdate) / 1000);
      if (diff < 60) setTimeAgo(`${diff}s ago`);
      else setTimeAgo(`${Math.floor(diff / 60)}m ago`);
    };
    const id = setInterval(update, 1000);
    update();
    return () => clearInterval(id);
  }, [lastUpdate]);

  const syncStatus = useMemo(() => {
    if (loading) return { color: "#ffb400", text: "🟡 Refreshing…" };
    if (!lastUpdate) return { color: "#f55", text: "🔴 Stale" };
    const age = (Date.now() - lastUpdate) / 1000;
    if (age < 60) return { color: "#00c853", text: "🟢 Live" };
    return { color: "#f55", text: "🔴 Stale" };
  }, [lastUpdate, loading]);

  /* ---------------------- Greeks Computation ---------------------- */
  const greekData = useMemo(() => {
    const range = [];
    for (let s = S * 0.5; s <= S * 1.5; s += S * 0.02) {
      const res = bs(s, K, r, q, sigma, T);
      range.push({
        S: s,
        call: res.call,
        put: res.put,
        delta: isCall ? res.deltaC : res.deltaP,
        gamma: res.gamma,
        vega: res.vega,
        theta: isCall ? res.thetaC : res.thetaP,
        rho: isCall ? res.rhoC : res.rhoP,
      });
    }
    return range;
  }, [S, K, r, q, sigma, T, isCall]);

  const current = bs(S, K, r, q, sigma, T);

  /* ---------------------- Vol Surface ---------------------- */
  const volSurface = useMemo(() => {
    const strikes = [];
    const vols = [];
    const values: number[][] = [];

    for (let k = K * 0.5; k <= K * 1.5; k += K * 0.05) strikes.push(k);
    for (let v = 0.1; v <= 0.6; v += 0.02) vols.push(v);

    for (let i = 0; i < strikes.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < vols.length; j++) {
        const res = bs(S, strikes[i], r, q, vols[j], T);
        row.push(isCall ? res.call : res.vega);
      }
      values.push(row);
    }
    return { strikes, vols, values };
  }, [S, K, r, q, T, isCall]);

  /* ---------------------- Handlers ---------------------- */
  const handleParamChange = (setter: any, name: string) => (e: any) => {
    const v = parseFloat(e.target.value);
    setter(v);
  };

  /* ---------------------- UI ---------------------- */
  return (
    <Layout title="Vanilla Option Pricer" description="Black–Scholes Pricer with Greeks & Visualization">
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", color: "#f0f0f0" }}>
        <h1 style={{ fontFamily: "serif", color: "#ffd166" }}>Vanilla Option Pricer</h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <SymbolDropdown
              currentSymbol={symbol}
              onSelect={(sym) => {
                setSymbol(sym);
                loadMarket(sym);
              }}
            />
            <button
              onClick={() => loadMarket(symbol)}
              disabled={loading}
              style={{
                marginLeft: 8,
                background: "linear-gradient(135deg, #d4af37, #ffd166)",
                color: "#222",
                border: "none",
                borderRadius: 10,
                padding: "8px 14px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
            <span style={{ marginLeft: 10, color: syncStatus.color, transition: "color 0.3s" }}>
              {syncStatus.text} <small>({timeAgo})</small>
            </span>
            <label style={{ display: "block", marginTop: 12 }}>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={() => setAutoSync(!autoSync)}
              />{" "}
              Auto-Sync Market (30s)
            </label>
            {error && <div style={{ color: "orange" }}>⚠ {error}</div>}
          </div>

          <div style={{ flex: 3, minWidth: 400 }}>
            <TradingViewWidget symbol={symbol} price={S} />
          </div>
        </div>

        <div style={{ marginTop: 30 }}>
          <h2>Model Parameters</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
            <div>
              <label>
                S (Spot)
                <InfoBox
                  title="Spot Price (S)"
                  content={
                    <>
                      Current market price of the underlying asset.
                      <br />
                      Directly impacts the option’s intrinsic value.
                      <br />
                      <em>Δ = ∂C/∂S</em> measures this sensitivity.
                    </>
                  }
                />
              </label>
              <input type="number" value={S} onChange={(e) => setS(parseFloat(e.target.value))} />
            </div>

            <div>
              <label>
                K (Strike)
                <InfoBox
                  title="Strike Price (K)"
                  content={
                    <>
                      Predetermined exercise price.
                      <br />
                      Defines option moneyness: in, at, or out of the money.
                    </>
                  }
                />
              </label>
              <input type="number" value={K} onChange={(e) => setK(parseFloat(e.target.value))} />
            </div>

            <div>
              <label>
                r (Rate)
                <InfoBox
                  title="Risk-Free Rate (r)"
                  content={
                    <>
                      Annualized continuously compounded interest rate.
                      <br />
                      Appears in discounting term: <em>e<sup>-rT</sup></em>.
                    </>
                  }
                />
              </label>
              <input type="number" step="0.01" value={r} onChange={(e) => setR(parseFloat(e.target.value))} />
            </div>

            <div>
              <label>
                q (Dividend)
                <InfoBox
                  title="Dividend Yield (q)"
                  content={
                    <>
                      Continuous dividend yield paid by the underlying.
                      <br />
                      Reduces forward drift: <em>S·e<sup>-(qT)</sup></em>.
                    </>
                  }
                />
              </label>
              <input type="number" step="0.001" value={q} onChange={(e) => setQ(parseFloat(e.target.value))} />
            </div>

            <div>
              <label>
                σ (Volatility)
                <InfoBox
                  title="Volatility (σ)"
                  content={
                    <>
                      Expected annualized standard deviation of returns.
                      <br />
                      Drives Vega and curvature (Γ).
                    </>
                  }
                />
              </label>
              <input type="number" step="0.01" value={sigma} onChange={(e) => setSigma(parseFloat(e.target.value))} />
            </div>

            <div>
              <label>
                T (Maturity)
                <InfoBox
                  title="Time to Maturity (T)"
                  content={
                    <>
                      Time remaining (in years) until expiration.
                      <br />
                      Affects Theta: shorter T ⇒ faster decay.
                    </>
                  }
                />
              </label>
              <input type="number" step="0.1" value={T} onChange={(e) => setT(parseFloat(e.target.value))} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 40 }}>
          <h2>Greeks Visualization ({isCall ? "Call" : "Put"})</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <GreeksChart data={greekData} dataKey="delta" title="Delta" color="#00bcd4" />
            <GreeksChart data={greekData} dataKey="gamma" title="Gamma" color="#8bc34a" />
            <GreeksChart data={greekData} dataKey="vega" title="Vega" color="#ff9800" />
            <GreeksChart data={greekData} dataKey="theta" title="Theta" color="#e91e63" />
            <GreeksChart data={greekData} dataKey="rho" title="Rho" color="#9c27b0" />
          </div>
        </div>

        <div style={{ marginTop: 40 }}>
          <h2>Vol Surface (Call Price)</h2>
          <Plot
            data={[
              {
                x: volSurface.strikes,
                y: volSurface.vols,
                z: volSurface.values,
                type: "surface",
                colorscale: "YlOrBr",
                showscale: true,
              },
            ]}
            layout={{
              autosize: true,
              height: 500,
              margin: { l: 30, r: 30, b: 40, t: 40 },
              scene: {
                xaxis: { title: "Strike (K)" },
                yaxis: { title: "Volatility (σ)" },
                zaxis: { title: isCall ? "Call Price" : "Vega" },
              },
              paper_bgcolor: "rgba(0,0,0,0)",
              plot_bgcolor: "rgba(0,0,0,0)",
              font: { color: "#eee" },
            }}
            config={{ displaylogo: false }}
            style={{ width: "100%", borderRadius: 12, background: "transparent" }}
          />
        </div>
      </div>
    </Layout>
  );
}
