import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Reward = {
  id?: string;
  type?: 'chapter_complete' | 'reset' | string;
  label?: string;
  stars?: number;
};

function StarRow({ stars = 3 }) {
  const full = Math.floor(stars);
  const half = stars - full >= 0.5;
  return (
    <div style={{ fontSize: 20, letterSpacing: 2 }}>
      {Array.from({ length: full }).map((_, i) => (
        <span key={i} style={{ color: '#ffd700', textShadow: '0 0 8px rgba(255,215,0,.45)' }}>★</span>
      ))}
      {half ? <span style={{ color: '#ffd700', opacity: 0.6 }}>☆</span> : null}
    </div>
  );
}

export default function RewardToaster() {
  const [queue, setQueue] = useState<Reward[]>([]);
  const [active, setActive] = useState<Reward | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const onReward = (e: Event) => {
      const d = (e as CustomEvent).detail as Reward;
      setQueue(q => q.concat(d || {}));
    };
    document.addEventListener('lux:reward', onReward as EventListener);
    return () => document.removeEventListener('lux:reward', onReward as EventListener);
  }, []);

  useEffect(() => {
    if (active || queue.length === 0) return;
    setActive(queue[0]);
    setQueue(q => q.slice(1));
  }, [queue, active]);

  useEffect(() => {
    if (!active) return;
    // auto-dismiss after 2400ms
    timerRef.current = window.setTimeout(() => setActive(null), 2400);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [active]);

  if (!active) return null;

  const icon =
    active.type === 'reset' ? '🧹' :
    active.type === 'chapter_complete' ? '🏅' : '✨';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
      }}
      aria-live="polite"
    >
      <div
        className="gold-glow"
        style={{
          minWidth: 260,
          maxWidth: 360,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          border: '1px solid rgba(212,175,55,0.45)',
          borderRadius: 14,
          padding: '12px 14px',
          background:
            'linear-gradient(180deg, rgba(15,18,23,0.88), rgba(15,18,23,0.72))',
          boxShadow:
            '0 0 .6rem rgba(255,215,0,.22), 0 0 2.6rem rgba(255,215,0,.12)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          color: '#f2f2f2',
          transform: 'translateY(0)',
          animation: 'luxToastIn .35s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        <div style={{ fontSize: 26, lineHeight: 1 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, letterSpacing: 0.3 }}>
            {active.label || (active.type === 'reset' ? 'Progress Reset' : 'Well done!')}
          </div>
          <div style={{ opacity: 0.9, marginTop: 2, fontSize: 13 }}>
            {active.type === 'reset'
              ? 'Stars cleared for this chapter.'
              : 'You’ve unlocked stars!'}
          </div>
          {active.stars ? (
            <div style={{ marginTop: 6 }}>
              <StarRow stars={active.stars} />
            </div>
          ) : null}
        </div>
        <button
          className="button"
          onClick={() => setActive(null)}
          style={{
            fontSize: 12,
            borderRadius: 10,
            padding: '6px 10px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)',
            whiteSpace: 'nowrap',
          }}
        >
          Close
        </button>
      </div>

      {/* tiny keyframes (scoped) */}
      <style>{`
        @keyframes luxToastIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
