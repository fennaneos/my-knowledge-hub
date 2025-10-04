import React, {useMemo} from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine, CartesianGrid,
} from 'recharts';

/**
 * Props:
 * - s0: spot level (number)
 * - r: risk-free rate (number, e.g. 0.02 for 2%)
 * - qs: array of dividend yields (e.g. [0, 0.02, 0.04])
 * - years: max maturity in years (e.g. 3)
 * - steps: number of time steps (default 60)
 */
export default function ForwardCurveChart({ s0=4200, r=0.02, qs=[0.00, 0.02, 0.04], years=3, steps=60 }) {
  const data = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= steps; i++) {
      const T = (years * i) / steps;
      const row = { T, Spot: s0 };
      qs.forEach((q, idx) => {
        const F = s0 * Math.exp((r - q) * T);
        row[`q_${(q*100).toFixed(0)}pct`] = F;
      });
      arr.push(row);
    }
    return arr;
  }, [s0, r, qs, years, steps]);

  const lines = qs.map((q, i) => {
    const key = `q_${(q*100).toFixed(0)}pct`;
    const color = i === 0 ? '#e6c200' : i === 1 ? '#ff5252' : '#59d2ff'; // gold, red, cyan
    return (
      <Line
        key={key}
        type="monotone"
        dataKey={key}
        stroke={color}
        strokeWidth={2.5}
        dot={false}
        name={`q = ${(q*100).toFixed(0)}%`}
      />
    );
  });

  return (
    <div style={{
      background: 'radial-gradient(circle at top left, #111, #000)',
      border: '1px solid rgba(212,175,55,0.4)',
      borderRadius: 12,
      padding: '1rem',
      boxShadow: '0 0 12px rgba(212,175,55,0.25)',
      margin: '1.25rem 0'
    }}>
      <h3 style={{ color: '#d4af37', margin: 0, marginBottom: 8 }}>
        Forward Curve of Index vs Single Stock
      </h3>
      <p style={{ color: '#ccc', marginTop: 0 }}>
        Index forward (gold/red/cyan) vs spot (white dashed). Higher dividends push the forward below spot.
      </p>
      <div style={{ width: '100%', height: 360 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 12, right: 18, bottom: 12, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
            <XAxis dataKey="T" stroke="#bbb" tick={{ fill: '#bbb' }} label={{ value: 'Maturity T (years)', position: 'insideBottom', offset: -4, fill: '#bbb' }} />
            <YAxis stroke="#bbb" tick={{ fill: '#bbb' }} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: '#0d0f12', border: '1px solid rgba(212,175,55,0.35)', borderRadius: 8, color: '#ddd' }}
              labelStyle={{ color: '#d4af37' }}
              formatter={(v, n) => [v.toFixed(2), n]}
              labelFormatter={(t) => `T = ${t.toFixed(2)}y`}
            />
            <Legend wrapperStyle={{ color: '#ccc' }} />
            <ReferenceLine y={s0} stroke="#ffffff" strokeDasharray="6 6" label={{ value: 'Spot (S₀)', fill: '#bbb', position: 'right' }} />
            {lines}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ color: '#d4af37', marginTop: 8, fontStyle: 'italic' }}>
        Parameters: S₀={s0}, r={(r*100).toFixed(0)}%, q ∈ [{qs.map(q => `${(q*100).toFixed(0)}%`).join(', ')}]
      </div>
    </div>
  );
}
