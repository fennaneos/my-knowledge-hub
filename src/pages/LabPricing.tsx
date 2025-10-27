import React from "react";
import siteConfig from "@generated/docusaurus.config";

const cf = (siteConfig.customFields ?? {}) as Record<string, string | undefined>;

const WEEKLY  = cf.LABS_WEEKLY  ?? "#";
const MONTHLY = cf.LABS_MONTHLY ?? "#";
const ANNUAL  = cf.LABS_ANNUAL  ?? "#";
const TEAMS   = cf.LABS_TEAMS   ?? "#";
const QUANT   = cf.LABS_QUANT   ?? ANNUAL; // optional


function Card({
  title,
  price,
  cadence,
  bullets,
  href,
  badge,
  highlight,
  soon = false,
}: {
  title: string;
  price: string;
  cadence: string;
  bullets: string[];
  href: string;
  badge?: string;
  highlight?: boolean;
  soon?: boolean;
}) {
  return (
    <div
      className="panel"
      style={{
        borderRadius: 18,
        padding: 22,
        background: "linear-gradient(140deg, rgba(20,22,29,.9), rgba(10,12,17,.95))",
        boxShadow: highlight
          ? "inset 0 0 0 1px rgba(212,175,55,.45), 0 20px 60px rgba(0,0,0,.45)"
          : "inset 0 0 0 1px rgba(255,255,255,.08), 0 16px 40px rgba(0,0,0,.35)",
        opacity: soon ? 0.78 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <div style={{ display: "flex", gap: 6 }}>
          {badge && (
            <span
              className="lux-chip"
              style={{ background: "rgba(139,123,255,.15)", border: "1px solid rgba(139,123,255,.5)" }}
            >
              {badge}
            </span>
          )}
          {soon && (
            <span
              className="lux-chip"
              style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.25)" }}
              title="Coming soon"
            >
              Soon
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 12 }}>
        <div style={{ fontSize: 36, fontWeight: 800 }}>{price}</div>
        <div style={{ opacity: 0.8 }}>{cadence}</div>
      </div>

      <ul style={{ margin: "12px 0 16px 18px", display: "grid", gap: 8 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ opacity: 0.9 }}>
            {b}
          </li>
        ))}
      </ul>

      {soon ? (
        <button
          className="btn-wire"
          disabled
          style={{ width: "100%", textAlign: "center", cursor: "not-allowed", opacity: 0.6 }}
          title="Coming soon"
        >
          Coming soon
        </button>
      ) : (
        <a
          className={highlight ? "btn-neo-red-modern pulse" : "btn-neo-red-modern"}
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{ width: "100%", textAlign: "center" }}
        >
          Get Access
        </a>
      )}

      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>Secure checkout • Cancel anytime</div>
    </div>
  );
}

export default function LabPricing() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 80px" }}>
      <section style={{ textAlign: "center", marginBottom: 22 }}>
        <div className="lux-chip" style={{ marginBottom: 10 }}>
          AsraelX Labs
        </div>
        <h1 style={{ margin: 0, fontSize: 44, lineHeight: 1.1 }}>
          Trade-grade simulations. Quant tools that compound.
        </h1>
        <p style={{ opacity: 0.85, marginTop: 10 }}>
          Unlock Monte Carlo engines, calibrators, predictors, and a notebook-first workflow.
        </p>
        <div className="cta-group">
          <a className="btn-neo-blue" href="/">
            Home
          </a>
          <a className="btn-ghost-blue" href="/premium/volatility-handbook">
            Premium Courses
          </a>
          <a className="btn-ghost-blue" href="/lab">
            Open Lab <span className="badge-new">NEW</span>
          </a>
        </div>
      </section>

      <section
        id="plans"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {/* FREE / Explorer (kept) */}
        <Card
          title="Explorer"
          price="$0"
          cadence="/forever"
          bullets={["Virtual Trading (demo data)", "EMA(9/21) overlays", "Docs & examples"]}
          href="/lab"
        />

        {/* TRADER — mark as Soon */}
        <Card
          title="Trader"
          price="$39"
          cadence="/month"
          bullets={[
            "Persistent virtual portfolio",
            "Backtest Studio + CSV",
            "PnL / Equity & trade tape",
            "AI Mentor (standard)",
          ]}
          href={MONTHLY}
          badge="Popular"
          soon
        />

        {/* QUANT — replaces Architect; highlight this plan */}
        <Card
          title="Quant"
          price="$349"
          cadence="/year"
          bullets={[
            "Everything in Trader",
            "Monte-Carlo engines (GBM/Heston/LocalVol/JD)",
            "Smile & term-structure calibration (SABR / SVI)",
            "Structured pricers (Autocall, Barrier, Basket, Quanto)",
            "Scenario lab: stress, paths, regime tests",
            "Predictors (ARIMA, EWMA, Kalman, XGBoost) + feature lab",
            "Notebook export (LaTeX + code cells)",
            "API keys & serverless hooks (fetch, caches, limits)",
          ]}
          href={QUANT}
          highlight
          badge="Best for Quants"
        />

        {/* TEAMS — mark as Soon */}
        <Card
          title="Teams"
          price="Custom"
          cadence="/year"
          bullets={["5–20 seats", "Seat dashboard", "Progress analytics", "Priority support"]}
          href={TEAMS}
          soon
        />
      </section>
    </div>
  );
}
