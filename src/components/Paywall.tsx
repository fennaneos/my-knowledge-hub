import React from "react";

export default function Paywall({
  open,
  onClose,
  ctaHref = "/pricing-labs",
  title = "Get Pro",
  bullets = [
    "Unlimited simulations & backtests",
    "Advanced indicators & panes",
    "Export results & sharpe badges",
    "Leaderboards + certificates"
  ],
}: {
  open: boolean;
  onClose: () => void;
  ctaHref?: string;
  title?: string;
  bullets?: string[];
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560, maxWidth: "94vw", padding: 18,
          background: "linear-gradient(140deg, rgba(16,18,28,.95), rgba(8,10,16,.96))",
          borderRadius: 18,
          boxShadow: "0 24px 60px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.08)",
        }}
      >
        <div className="panelHeader" style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <span className="lux-chip">Pro</span>
            <b>{title}</b>
          </div>
          <button className="lux-ghost" onClick={onClose}>Close</button>
        </div>
        <div className="panelBody" style={{display:"grid", gap:10}}>
          <ul style={{margin:"0 0 0 18px", display:"grid", gap:6}}>
            {bullets.map((b,i)=><li key={i} style={{opacity:.9}}>{b}</li>)}
          </ul>
          <div className="cta-group" style={{display:"flex", gap:8, justifyContent:"flex-end"}}>
            <a className="btn-ghost-blue" href="/lab">Try Lab</a>
            <a className="btn-neo-red-modern" href={ctaHref}>Upgrade →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
