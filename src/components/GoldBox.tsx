import React, { useEffect, useState } from "react";

export function GoldBox({ title, children }: { title: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;

  return (
    <div
      style={{
        background: "linear-gradient(180deg,#3a2e13,#1c1608)",
        border: "1px solid #d6b25f",
        boxShadow: "0 6px 20px rgba(214,178,95,.25), inset 0 1px 0 rgba(255,255,255,.08)",
        borderRadius: 12,
        padding: 14,
        transition: "opacity 0.6s ease",
      }}
    >
      <div style={{ fontWeight: 800, color: "#ffd166", marginBottom: 6 }}>{title}</div>
      <div style={{ opacity: 0.95 }}>{children}</div>
    </div>
  );
}
