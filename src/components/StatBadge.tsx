import React from "react";

export default function StatBadge({
  label,
  value,
}: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(212,175,55,0.25)",
        borderRadius: 12,
        padding: "10px 14px",
        minWidth: 160,
        background: "rgba(255,255,255,0.03)",
        boxShadow: "0 0 .5rem rgba(255,215,0,.10), 0 0 1.6rem rgba(255,215,0,.06)",
      }}
      className="gold-glow"
    >
      <div style={{ color: "#ffd700", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}
