// src/pages/products/apis.tsx
import React, { useMemo, useState } from "react";
import Layout from "@theme/Layout";
import BrowserOnly from "@docusaurus/BrowserOnly";

type OHLC = { date: string; open: number; high: number; low: number; close: number; volume: number };

const NASDAQ_TOP10 = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "AVGO", "TSLA", "COST", "PEP"];

const apiBase =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8888/.netlify/functions/market"
    : "/.netlify/functions/market";

export default function MarketAPIConsole() {
  const [symbol, setSymbol] = useState("AAPL");
  const [days, setDays] = useState(240);
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runFetch() {
    setLoading(true);
    setError(null);
    try {
      const url = `${apiBase}?action=all&symbol=${encodeURIComponent(symbol)}&days=${days}`;
      const r = await fetch(url);
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      setResp(j);
    } catch (e: any) {
      setError(e.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  }

  const closes = useMemo<OHLC[]>(() => resp?.ohlc?.series ?? [], [resp]);

  return (
    <Layout title="Market API Console" description="Free data via Yahoo/Stooq with charts & options">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 16px 40px" }}>
        <h1 style={{ margin: 0, fontWeight: 800 }}>Market API Console</h1>
        <div style={{ opacity: 0.85, marginTop: 4 }}>Explore our serverless “all-in-one” market endpoint.</div>

        {/* Controls */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto 1fr auto",
            gap: 10,
            alignItems: "center",
            marginTop: 14,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {NASDAQ_TOP10.map((s) => (
              <button
                key={s}
                onClick={() => setSymbol(s)}
                className={symbol === s ? "btn-neo-blue" : "btn-ghost-blue"}
                style={{ padding: "6px 10px", borderRadius: 10 }}
              >
                {s}
              </button>
            ))}
          </div>

          <label style={{ display: "grid", gap: 4, minWidth: 120 }}>
            <span style={{ opacity: 0.7, fontSize: 12 }}>Custom Symbol</span>
            <input
              className="num"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.trim().toUpperCase())}
              style={{ padding: "6px 8px", borderRadius: 8 }}
            />
          </label>

          <label style={{ display: "grid", gap: 4, maxWidth: 180 }}>
            <span style={{ opacity: 0.7, fontSize: 12 }}>Days</span>
            <input
              type="number"
              min={30}
              max={2000}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value || "240", 10))}
              className="num"
            />
          </label>

          <button
            className="btn-neo-blue"
            onClick={runFetch}
            disabled={loading}
            style={{ padding: "8px 16px", borderRadius: 10, fontWeight: 700 }}
          >
            {loading ? "Loading…" : "Fetch"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 12, color: "#ffd166" }}>
            ⚠ {error}
          </div>
        )}

        {/* Quote + Stats */}
        {resp && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12, marginTop: 16 }}>
            <div className="panel" style={{ padding: 12 }}>
              <div className="panelHeader">Quote</div>
              <div className="panelBody" style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>
                  {resp.quote?.symbol} · {Number(resp.quote?.price ?? 0).toFixed(2)} {resp.quote?.currency || "USD"}
                </div>
                <div style={{ opacity: 0.9 }}>
                  Δ {Number(resp.quote?.change ?? 0).toFixed(2)} ({Number(resp.quote?.changePct ?? 0).toFixed(2)}%) ·{" "}
                  <span style={{ opacity: 0.8 }}>{resp.quote?.time}</span>
                </div>
                <div style={{ opacity: 0.8 }}>{resp.stats?.name} — {resp.stats?.exchange}</div>
              </div>
            </div>

            <div className="panel" style={{ padding: 12 }}>
              <div className="panelHeader">Key Stats</div>
              <div className="panelBody" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Stat label="Market Cap" value={fmtNum(resp.stats?.marketCap)} />
                <Stat label="Trailing PE" value={fmtNum(resp.stats?.trailingPE)} />
                <Stat label="Forward PE" value={fmtNum(resp.stats?.forwardPE)} />
                <Stat label="Dividend Yield" value={fmtPct(resp.stats?.dividendYield)} />
                <Stat label="52w High" value={fmtNum(resp.stats?.fiftyTwoWeekHigh)} />
                <Stat label="52w Low" value={fmtNum(resp.stats?.fiftyTwoWeekLow)} />
              </div>
            </div>
          </div>
        )}

        {/* Charts (Client-only to avoid SSR issues) */}
        <BrowserOnly>
          {() => {
            const {
              LineChart,
              Line,
              XAxis,
              YAxis,
              CartesianGrid,
              Tooltip,
              ResponsiveContainer,
              Legend,
              Area,
              AreaChart,
            } = require("recharts");

            return resp ? (
              <>
                <div className="panel" style={{ padding: 12, marginTop: 12 }}>
                  <div className="panelHeader">Close + SMA(20/50)</div>
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={closes.map((d: OHLC, i: number) => ({
                          date: d.date,
                          close: d.close,
                          sma20: resp.ohlc?.indicators?.sma20?.[i],
                          sma50: resp.ohlc?.indicators?.sma50?.[i],
                        }))}
                      >
                        <CartesianGrid stroke="rgba(255,255,255,.08)" />
                        <XAxis dataKey="date" tick={{ fill: "#9fb3c8", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#9fb3c8", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ background: "#0b1220", border: "1px solid #1f2a44" }}
                          labelStyle={{ color: "#cfd8e3" }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="close" stroke="#7fd1ff" dot={false} strokeWidth={2} />
                        <Line type="monotone" dataKey="sma20" stroke="#ffd166" dot={false} strokeWidth={1.5} />
                        <Line type="monotone" dataKey="sma50" stroke="#c59cff" dot={false} strokeWidth={1.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel" style={{ padding: 12, marginTop: 12 }}>
                  <div className="panelHeader">Realized Volatility (20d, annualized)</div>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={closes.map((d: OHLC, i: number) => ({
                          date: d.date,
                          rv20: resp.ohlc?.indicators?.rv20?.[i] != null ? resp.ohlc.indicators.rv20[i] * 100 : null,
                        }))}
                      >
                        <CartesianGrid stroke="rgba(255,255,255,.08)" />
                        <XAxis dataKey="date" tick={{ fill: "#9fb3c8", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#9fb3c8", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ background: "#0b1220", border: "1px solid #1f2a44" }}
                          labelStyle={{ color: "#cfd8e3" }}
                          formatter={(v: any) => [`${Number(v || 0).toFixed(2)}%`, "RV20"]}
                        />
                        <Area type="monotone" dataKey="rv20" stroke="#66e0ff" fill="rgba(102,224,255,.18)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : null;
          }}
        </BrowserOnly>

        {/* Options snapshot */}
        {resp?.options && (
          <div className="panel" style={{ padding: 12, marginTop: 12 }}>
            <div className="panelHeader">
              Options (nearest expiry) · ATM IV: {resp.options.ivAtm ? (resp.options.ivAtm * 100).toFixed(2) : "--"}%
            </div>
            <div className="panelBody" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <OptTable title="Calls (near ATM)" rows={resp.options.calls || []} />
              <OptTable title="Puts (near ATM)" rows={resp.options.puts || []} />
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="panel" style={{ padding: 14, marginTop: 16 }}>
          <div className="panelHeader">Recreate This Yourself</div>
          <div className="panelBody" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ opacity: 0.9 }}>
              We’ll walk through “API keys & serverless hooks (fetch, caches, limits)” step-by-step in the Premium
              Courses.
            </div>
            <a className="btn-neo-red-modern" href="/pricing-labs">Try it yourself → Premium Courses</a>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ---------- Tiny presentational helpers ---------- */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <div style={{ opacity: 0.7, fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}
function fmtNum(x: any) {
  if (x == null || !Number.isFinite(Number(x))) return "—";
  const n = Number(x);
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
}
function fmtPct(x: any) {
  if (x == null || !Number.isFinite(Number(x))) return "—";
  return (Number(x) * 100).toFixed(2) + "%";
}

function OptTable({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{title}</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px dashed rgba(255,255,255,.15)" }}>
              <th style={th}>Strike</th>
              <th style={th}>Last</th>
              <th style={th}>Bid</th>
              <th style={th}>Ask</th>
              <th style={th}>Vol</th>
              <th style={th}>OI</th>
              <th style={th}>IV</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px dashed rgba(255,255,255,.08)" }}>
                <td style={td}>{fmtNum(r.strike)}</td>
                <td style={td}>{fmtNum(r.lastPrice)}</td>
                <td style={td}>{fmtNum(r.bid)}</td>
                <td style={td}>{fmtNum(r.ask)}</td>
                <td style={td}>{fmtNum(r.volume)}</td>
                <td style={td}>{fmtNum(r.openInterest)}</td>
                <td style={td}>{r.impliedVolatility != null ? (r.impliedVolatility * 100).toFixed(2) + "%" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ opacity: 0.7, marginTop: 6, fontSize: 12 }}>
        Small sample around ATM to keep payloads light. Full chains require a paid feed or pagination.
      </div>
    </div>
  );
}
const th: React.CSSProperties = { textAlign: "left", padding: "6px 8px", opacity: 0.8 };
const td: React.CSSProperties = { textAlign: "left", padding: "6px 8px" };
