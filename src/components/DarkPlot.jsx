import React from 'react';

export default function DarkPlot({ title, description }) {
  return (
    <div
      style={{
        background: 'radial-gradient(circle at top left, #111, #000)',
        border: '1px solid rgba(212,175,55,0.4)',
        borderRadius: '12px',
        padding: '1.5rem',
        margin: '1.5rem 0',
        boxShadow: '0 0 12px rgba(212,175,55,0.25)',
      }}
    >
      <h3 style={{ color: '#d4af37', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: '#ccc' }}>{description}</p>
      <div
        style={{
          height: '220px',
          background:
            'linear-gradient(to right, rgba(255,215,0,0.1), rgba(255,215,0,0.05))',
          borderRadius: '8px',
          border: '1px dashed rgba(255,215,0,0.25)',
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontStyle: 'italic',
        }}
      >
        (Chart Placeholder)
      </div>
    </div>
  );
}
