// src/components/MarketProbe.tsx
import React, { useEffect, useState } from "react";

const TOP10 = [
  "AAPL","MSFT","NVDA","GOOGL","AMZN",
  "META","TSLA","AVGO","COST","NFLX"
];

export default function MarketProbe() {
  const [symbol, setSymbol] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const API_BASE =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:8888/.netlify/functions"
      : "/.netlify/functions";

  async function load() {
    setLoading(true);
    setErr(null);
    setData(null);
    try {
      const res = await fetch(`${API_BASE}/market?symbol=${encodeURIComponent(symbol)}`);
      const j = await res.json();
      if (j.error) throw new Error(j.error);
      setData(j);
    } catch (e: any) {
      setErr(e.message || "failed_to_fetch");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial fetch
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        border: "1px solid rgba(212,175,55,0.25)",
        borderRadius: 14,
        padding: 16,
        background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))",
        boxShadow: "0 0 14px rgba(212,175,55,0.08)",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ color: "#ffd873", fontWeight: 700 }}>Symbol</label>
        <div style={{ position: "relative" }}>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            style={{
              appearance: "none",
              background: "rgba(10,14,20,.85)",
              border: "1px solid rgba(212,175,55,0.35)",
              color: "#e6edf3",
              padding: "8px 36px 8px 12px",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            {TOP10.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button
          onClick={load}
          disabled={loading}
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid #f0c56a",
            color: "#111318",
            background: "linear-gradient(180deg, #ffd166, #e9b14e)",
            boxShadow: "0 6px 16px rgba(233,177,78,.35), inset 0 1px 0 rgba(255,255,255,.6)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {loading ? "Loading…" : `Fetch ${symbol}`}
        </button>

        <a
          href="/premium/api-hooks"
          style={{
            marginLeft: "auto",
            textDecoration: "none",
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px dashed rgba(255,214,102,.55)",
            color: "#ffd166",
            background: "rgba(255,214,102,.06)",
            fontWeight: 700,
          }}
          title="See how to build your own: API keys & serverless hooks (fetch, caches, limits)"
        >
          Want to try it yourself? →
        </a>
      </div>

      {err && <div style={{ color: "orange", marginTop: 10 }}>⚠ {err}</div>}

      {data && (
        <div style={{ marginTop: 12, color: "#e8edf5", display: "grid", gap: 6 }}>
          <div><strong>Symbol:</strong> {data.symbol}</div>
          <div><strong>Price:</strong> {Number(data.price).toFixed(2)}</div>
          <div><strong>Dividend Yield:</strong> {(Number(data.dividendYield) * 100).toFixed(2)}%</div>
          {data.iv !== undefined && <div><strong>Near-ATM IV:</strong> {(Number(data.iv) * 100).toFixed(2)}%</div>}
          <div style={{ opacity: 0.85 }}>
            <strong>Source:</strong> {data.source} &nbsp; | &nbsp;
            <strong>As Of:</strong> {new Date(data.asOf).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
