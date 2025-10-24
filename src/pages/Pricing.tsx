import React from "react";
import { Link } from "react-router-dom";

function Card({
  title,
  price,
  period,
  features,
  cta,
  accent,
}: {
  title: string;
  price: string;
  period: string;
  features: string[];
  cta: React.ReactNode;
  accent?: "blue" | "gold" | "red";
}) {
  const border =
    accent === "gold"
      ? "#bda86a"
      : accent === "red"
      ? "#ff6b6b"
      : "#3ecbff";

  return (
    <div
      className="panel"
      style={{
        padding: 18,
        border: `1px solid ${border}`,
        background:
          "linear-gradient(180deg, rgba(10,20,40,.65), rgba(6,12,24,.9))",
        minWidth: 280,
      }}
    >
      <div
        className="panelHeader"
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <b>{title}</b>
        {accent === "gold" && (
          <span
            style={{
              fontSize: 12,
              padding: "2px 8px",
              borderRadius: 999,
              background: "rgba(212,175,55,.15)",
              border: "1px solid rgba(212,175,55,.35)",
              color: "#ecdca6",
            }}
          >
            Best Value
          </span>
        )}
      </div>

      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
        {price}
        <span style={{ fontSize: 12, opacity: 0.8 }}> / {period}</span>
      </div>

      <ul style={{ marginTop: 10, marginLeft: 18, lineHeight: 1.6 }}>
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <div style={{ marginTop: 14 }}>{cta}</div>
    </div>
  );
}

export default function Pricing() {
  return (
    <div style={{ padding: 20 }}>
      <div
        className="panel"
        style={{
          padding: 18,
          background:
            "linear-gradient(180deg, rgba(15,25,45,.8), rgba(10,16,28,.9))",
          border: "1px solid #1b3d63",
          marginBottom: 16,
        }}
      >
        <div className="panelHeader" style={{ display: "flex", gap: 8 }}>
          Choose your plan
          <span
            style={{
              padding: "0 8px",
              borderRadius: 6,
              fontSize: 12,
              background: "rgba(72,203,255,.12)",
              border: "1px solid rgba(72,203,255,.35)",
            }}
          >
            Includes Virtual Trading Lab
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          <Card
            title="Explorer"
            price="$0"
            period="mo"
            features={[
              "Basic charts (demo data)",
              "Virtual Monitoring (Black–Scholes, Bollinger)",
              "Learn pages & examples",
            ]}
            cta={
              <Link to="/virtual" className="lux-outline">
                Try Virtual Trading
              </Link>
            }
            accent="blue"
          />
          <Card
            title="Trader"
            price="$39"
            period="mo"
            features={[
              "Full Virtual Trading page (signals, Buy/Sell)",
              "Backtest Studio (EMA/RSI) + CSV upload",
              "PnL / Equity curve, trade tape",
              "AI Mentor (explanations on your runs)",
            ]}
            cta={
              <Link to="/virtual" className="lux-btn">
                Start Trading
              </Link>
            }
            accent="red"
          />
          <Card
            title="Architect"
            price="$349"
            period="yr"
            features={[
              "Everything in Trader",
              "Pro screens: factor scans, walk-forward",
              "Weekly data digests & strategy reviews",
              "Priority support",
            ]}
            cta={
              <a href="/checkout?plan=architect" className="lux-btn">
                Get Annual
              </a>
            }
            accent="gold"
          />
          <Card
            title="Institutional"
            price="Custom"
            period=""
            features={[
              "Team seats & SSO",
              "Admin dashboard & analytics",
              "Private support channel",
            ]}
            cta={
              <a href="mailto:contact@yourbrand.com" className="lux-outline">
                Contact Sales
              </a>
            }
            accent="blue"
          />
        </div>
      </div>
    </div>
  );
}
