// src/components/CorrelationMini.tsx
import React from "react";

export default function CorrelationMini({
  labels,
  values, // symmetric matrix as row-major [i*n + j]
}: {
  labels: string[];
  values: number[];
}) {
  const n = labels.length;
  const cell = (i: number, j: number) => values[i * n + j];
  const color = (x: number) => {
    const v = Math.max(-1, Math.min(1, x));
    const g = Math.round(((v + 1) / 2) * 255);
    const r = 255 - g;
    return `rgba(${r},${g},120,.85)`;
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: `80px repeat(${n}, 1fr)`, gap: 4 }}>
      <div />
      {labels.map((l) => (
        <div key={l} style={{ fontSize: 12, opacity: 0.7, textAlign: "center" }}>{l}</div>
      ))}
      {labels.map((ri, i) => (
        <React.Fragment key={ri}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{ri}</div>
          {labels.map((_, j) => {
            const v = cell(i, j);
            const txt = v == null ? "—" : v.toFixed(2);
            return (
              <div key={ri + j}
                   title={`ρ ≈ ${txt}`}
                   style={{
                     height: 18,
                     borderRadius: 4,
                     background: v == null ? "rgba(255,255,255,.06)" : color(v),
                     display: "grid",
                     placeItems: "center",
                     fontSize: 11,
                   }}>
                {txt}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
