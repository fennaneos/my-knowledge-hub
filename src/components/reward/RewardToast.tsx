import React, { useEffect, useState } from 'react';

type RewardPayload = {
  id?: string;
  stars?: number;
  label?: string;     // main message
  sublabel?: string;  // optional small text
  type?: 'win' | 'reset' | 'info';
};

export default function RewardToaster() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<RewardPayload>({});

  useEffect(() => {
    let hideTimer: number | undefined;

    const onReward = (e: Event) => {
      const detail = (e as CustomEvent).detail as RewardPayload;

      // choose visuals per type
      const payload: RewardPayload = {
        type: detail?.type ?? 'win',
        label: detail?.label ?? (detail?.type === 'reset' ? 'Progress reset ✨' : 'Great job!'),
        sublabel: detail?.sublabel,
        stars: detail?.stars,
        id: detail?.id,
      };

      setMsg(payload);
      setOpen(true);

      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setOpen(false), 2800);
    };

    document.addEventListener('lux:reward', onReward as EventListener);
    return () => {
      document.removeEventListener('lux:reward', onReward as EventListener);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!open) return null;

  // styles
  const isReset = msg.type === 'reset';
  const accent = isReset ? '#54e1a5' : '#ffd700';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 18,
        right: 18,
        zIndex: 9999,
        padding: '14px 16px',
        borderRadius: 14,
        border: `1px solid rgba(255,255,255,0.10)`,
        background:
          'linear-gradient(180deg, rgba(15,18,23,0.92), rgba(15,18,23,0.86))',
        boxShadow:
          '0 0 .6rem rgba(255,215,0,.18), 0 0 2.4rem rgba(255,215,0,.08)',
        backdropFilter: 'blur(8px)',
        color: '#eaeaea',
        minWidth: 260,
      }}
      className="gold-glow"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background:
              isReset
                ? 'linear-gradient(135deg, rgba(84,225,165,.25), rgba(84,225,165,.08))'
                : 'linear-gradient(135deg, rgba(255,215,0,.25), rgba(255,215,0,.08))',
            border: `1px solid ${accent}55`,
            display: 'grid',
            placeItems: 'center',
            fontSize: 16,
          }}
        >
          {isReset ? '🧹' : '🏆'}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 800,
              letterSpacing: 0.2,
              color: accent,
            }}
          >
            {msg.label}
          </div>
          {msg.sublabel && (
            <div style={{ opacity: 0.9, fontSize: 12, marginTop: 2 }}>
              {msg.sublabel}
            </div>
          )}
        </div>
        {!isReset && typeof msg.stars === 'number' && (
          <div
            aria-hidden
            style={{ fontSize: 18, letterSpacing: 2, color: '#ffd700' }}
          >
            {'★'.repeat(Math.min(3, Math.round(msg.stars)))}
          </div>
        )}
      </div>
    </div>
  );
}
