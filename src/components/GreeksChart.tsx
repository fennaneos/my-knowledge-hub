import React from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from "recharts";

export function GreeksChart({
  data, dataKey, title, color, symbol, s, k, label
}: {
  data: any[]; dataKey: string; title: string; color: string;
  symbol: string; s: number; k: number; label: string;
}) {
  return (
    <div className="panel" style={{ padding: 12 }}>
      <div className="panelHeader">{title}</div>
      <div className="panelBody" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,.1)" strokeDasharray="3 3" />
            <XAxis dataKey="S" tick={{ fill: "#9aa4b2", fontSize: 12 }} />
            <YAxis tick={{ fill: "#9aa4b2", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: "#0b1220", border: "1px solid #1f2a44" }}
              labelStyle={{ color: "#cfd8e3" }}
              formatter={(v) => [(v as number).toFixed(3), label]}
              labelFormatter={(l) => `S = ${l}`}
            />
            <ReferenceLine x={s} stroke="rgba(255,255,255,.35)" strokeDasharray="4 4" />
            <ReferenceLine x={k} stroke="rgba(102,225,255,.6)" strokeDasharray="2 6" />
            <ReferenceLine y={0} stroke="rgba(255,255,255,.2)" />
            <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
