import React, { useEffect, useState } from 'react';

type Reward = { id: string; stars: number; label?: string };

export default function RewardToast() {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<Reward | null>(null);

  useEffect(() => {
    const onReward = (e: Event) => {
      const det = (e as CustomEvent).detail as Reward;
      if (!det?.id) return;
      setPayload(det);
      setOpen(true);
      // auto-close after 3.5s
      const t = setTimeout(() => setOpen(false), 3500);
      return () => clearTimeout(t);
    };
    document.addEventListener('lux:reward', onReward as EventListener);
    return () => document.removeEventListener('lux:reward', onReward as EventListener);
  }, []);

  if (!open || !payload) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 18,
        bottom: 18,
        zIndex: 9999,
        padding: '14px 16px',
        borderRadius: 14,
        border: '1px solid rgba(212,175,55,0.35)',
        boxShadow: '0 0 14px rgba(255,215,0,.18), 0 0 40px rgba(255,215,0,.10)',
        background:
          'linear-gradient(180deg, rgba(15,18,23,0.85), rgba(15,18,23,0.75))',
        color: '#fff',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        minWidth: 260,
        transform: 'translateY(0)',
        animation: 'luxToastIn 360ms cubic-bezier(.2,.8,.2,1)',
        borderLeft: '3px solid #ffd700',
      }}
    >
      <style>{`
        @keyframes luxToastIn {
          from { opacity: 0; transform: translateY(10px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        .goldTitle {
          background: linear-gradient(90deg, #b58e2f, #ffd700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
        }
        .starBurst {
          font-size: 20px;
          text-shadow: 0 0 8px rgba(255,215,0,.45);
        }
      `}</style>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="starBurst">★ ★ ★</div>
        <div style={{ flex: 1 }}>
          <div className="goldTitle" style={{ fontSize: 14, lineHeight: 1 }}>
            {payload.label || 'You earned stars!'}
          </div>
          <div style={{ fontSize: 12, color: '#cfcfcf', marginTop: 4 }}>
            Chapter <span style={{ color: '#ffd700' }}>{payload.id}</span>
          </div>
        </div>
        <button
          className="button"
          onClick={() => setOpen(false)}
          style={{
            borderRadius: 10,
            padding: '6px 10px',
            border: '1px solid rgba(212,175,55,0.35)',
            background: 'rgba(255,255,255,0.04)',
            color: '#eaeaea',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
