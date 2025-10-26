// src/pages/products/index.tsx
import React, { useMemo, useState } from "react";
import Layout from "@theme/Layout";

type SectionKey = "pricers" | "apis";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "pricers", label: "Pricers" },
  { key: "apis", label: "APIs & Serverless" },
];

export default function ProductsPage() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SectionKey>("pricers");

  // Netlify local or deployed base
  const API_BASE =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:8888/.netlify/functions"
      : "/.netlify/functions";

  return (
    <Layout title="Products" description="Pricers, APIs & serverless hooks">
      <div style={styles.pageWrap}>
        <header style={styles.header}>
          <h1 style={styles.title}>Price. Simulate. Understand.</h1>
          <p style={styles.subtitle}>
            Choose a section from the menu to explore tools and integrations.
          </p>

          {/* Dropdown selector */}
          <div style={styles.dropdownWrap}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={open}
              style={styles.dropdownBtn}
            >
              <span>Section: {SECTIONS.find((s) => s.key === section)?.label}</span>
              <span style={{ opacity: 0.85, marginLeft: 8 }}>⏷</span>
            </button>

            {open && (
              <ul
                role="listbox"
                tabIndex={-1}
                style={styles.dropdownMenu}
                onMouseLeave={() => setOpen(false)}
              >
                {SECTIONS.map((opt) => (
                  <li
                    key={opt.key}
                    role="option"
                    aria-selected={opt.key === section}
                    onClick={() => {
                      setSection(opt.key);
                      setOpen(false);
                    }}
                    style={{
                      ...styles.menuItem,
                      ...(opt.key === section ? styles.menuItemActive : {}),
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        <main style={styles.main}>
          {section === "pricers" ? <PricersSection /> : <ApisSection apiBase={API_BASE} />}
        </main>
      </div>
    </Layout>
  );
}

/* -------------------- PRICERS SECTION -------------------- */
function PricersSection() {
  const cards = useMemo(
    () => [
      {
        title: "Vanilla Option (BS)",
        tag: "Equity",
        to: "/pricer/Vanilla",
        docs: "/finance/Options-vanilla",
        preview: "AAPL",
      },
      {
        title: "Basket Option",
        tag: "Multi-Asset",
        to: "#",
        docs: "#",
        preview: "NVDA",
      },
      {
        title: "Barrier Option",
        tag: "Equity",
        to: "#",
        docs: "#",
        preview: "SPY",
      },
    ],
    []
  );

  return (
    <section>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Pricers</h2>
        <p style={styles.sectionText}>
          Live previews of underlyings, with quick links to each pricer. Works offline (demo)
          and upgrades to live when a data provider is configured.
        </p>
      </div>

      <div style={styles.cardGrid}>
        {cards.map((c) => (
          <article key={c.title} style={styles.card}>
            <div style={styles.cardHead}>
              <span style={styles.badge}>{c.tag}</span>
              <h3 style={styles.cardTitle}>{c.title}</h3>
            </div>
            <div style={styles.sparkline} aria-hidden />
            <div style={styles.btnRow}>
              <a href={c.to} style={styles.btnGold}>Price</a>
              <a href={c.docs} style={styles.btnGhost}>Details</a>
            </div>
            <div style={styles.cardFoot}>Preview: {c.preview}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* -------------------- APIS SECTION -------------------- */
function ApisSection({ apiBase }: { apiBase: string }) {
  const [symbol, setSymbol] = useState("AAPL");
  const [out, setOut] = useState<string>("");

  async function demoFetch() {
    try {
      setOut("Fetching…");
      const r = await fetch(`${apiBase}/quote?symbol=${encodeURIComponent(symbol)}`);
      const j = await r.json();
      setOut(JSON.stringify(j, null, 2));
    } catch (e: any) {
      setOut(`Error: ${e?.message || "unknown"}`);
    }
  }

  return (
    <section>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>APIs & Serverless Hooks</h2>
        <p style={styles.sectionText}>
          Fetch market data from free sources (Stooq/Yahoo) through a Netlify Function. Add caching,
          rate-limits, and API keys when you upgrade. Below is a tiny demo you can call directly.
        </p>
      </div>

      <div style={styles.apiPanel}>
        <div style={{ display: "grid", gap: 10 }}>
          <label style={styles.label}>
            Symbol
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              style={styles.input}
              placeholder="AAPL"
            />
          </label>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={demoFetch} style={styles.btnGold}>Fetch Quote</button>
            <a href="/premium/api-keys" style={styles.btnGhost}>
              Want to try it yourself?
            </a>
          </div>
        </div>

        <pre style={styles.pre} aria-live="polite">{out || "— output will appear here —"}</pre>
      </div>

      <ul style={styles.bullets}>
        <li>Serverless endpoint: <code>/.netlify/functions/quote?symbol=XYZ</code></li>
        <li>Add caching headers and quotas for premium users.</li>
        <li>Use the same endpoint inside your pricers to stay consistent.</li>
      </ul>
    </section>
  );
}

/* -------------------- STYLES -------------------- */
const styles: Record<string, React.CSSProperties> = {
  pageWrap: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "20px 16px 48px",
    color: "#e8edf5",
  },
  header: { display: "grid", gap: 8, marginBottom: 18 },
  title: {
    margin: 0,
    fontWeight: 800,
    fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)",
    background: "linear-gradient(90deg, #d4af37, #ffd700)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: { margin: 0, color: "#b9c6d6" },

  dropdownWrap: { position: "relative", width: "fit-content", marginTop: 6 },
  dropdownBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(212,175,55,.35)",
    background: "linear-gradient(180deg, #141720, #0b0e14)",
    color: "#ffd873",
    cursor: "pointer",
  },
  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    minWidth: 220,
    padding: 6,
    margin: 0,
    listStyle: "none",
    borderRadius: 12,
    border: "1px solid rgba(212,175,55,.35)",
    background: "linear-gradient(180deg, #12161f, #0b0e14)",
    boxShadow: "0 12px 28px rgba(0,0,0,.45)",
    zIndex: 10,
  },
  menuItem: {
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
    color: "#e6edf7",
  },
  menuItemActive: {
    background: "rgba(255,214,102,.1)",
    color: "#ffd166",
    border: "1px dashed rgba(255,214,102,.45)",
  },

  main: { display: "grid", gap: 18 },

  sectionHeader: { display: "grid", gap: 6, marginTop: 6, marginBottom: 8 },
  sectionTitle: { margin: 0, color: "#ffd166" },
  sectionText: { margin: 0, color: "#cfd8e3", opacity: 0.9 },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(240px, 1fr))",
    gap: 16,
  },
  card: {
    borderRadius: 16,
    border: "1px solid rgba(255,214,102,.18)",
    background:
      "linear-gradient(180deg,#141720 0%, #0b0e14 100%), radial-gradient(480px 280px at 30% -20%, rgba(255,214,102,.12), transparent 60%)",
    padding: 14,
    boxShadow: "0 10px 26px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.05)",
    display: "grid",
    gap: 10,
  },
  cardHead: { display: "grid", gap: 6 },
  badge: {
    fontSize: 12,
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 999,
    color: "#ffd166",
    border: "1px dashed rgba(255,214,102,.5)",
    background: "rgba(255,214,102,.06)",
    width: "fit-content",
  },
  cardTitle: { margin: 0, fontWeight: 800, color: "#eef2ff" },
  sparkline: {
    height: 60,
    borderRadius: 10,
    background:
      "linear-gradient(180deg, rgba(255,214,102,.08), transparent 60%), linear-gradient(180deg, #0f1420, #0b0e14)",
  },
  btnRow: { display: "flex", gap: 10, marginTop: 2 },
  btnGold: {
    textDecoration: "none",
    padding: "8px 14px",
    borderRadius: 12,
    fontWeight: 700,
    color: "#111318",
    background: "linear-gradient(180deg,#ffd166,#f4c048)",
    boxShadow: "0 6px 18px rgba(255,214,102,.25)",
    border: "1px solid #efc46a",
  },
  btnGhost: {
    textDecoration: "none",
    padding: "8px 14px",
    borderRadius: 12,
    fontWeight: 700,
    color: "#ffd166",
    border: "1px dashed rgba(255,214,102,.55)",
    background: "rgba(255,214,102,.06)",
  },
  cardFoot: { fontSize: 12, color: "#9fb3c8" },

  apiPanel: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: 16,
    border: "1px solid rgba(255,214,102,.18)",
    borderRadius: 16,
    padding: 14,
    background: "linear-gradient(180deg,#141720, #0b0e14)",
  },
  label: { display: "grid", gap: 6, color: "#e8edf5" },
  input: {
    outline: "none",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.18)",
    background: "#0f1420",
    color: "#e8edf5",
  },
  pre: {
    margin: 0,
    padding: 12,
    borderRadius: 12,
    background: "#0f1420",
    border: "1px solid rgba(255,255,255,.08)",
    color: "#dfe7f3",
    minHeight: 140,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  bullets: { marginTop: 10, color: "#cfd8e3", lineHeight: 1.6 },
};
