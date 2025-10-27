// src/components/ui/ProgressCelebration.tsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

let portalRoot: HTMLElement | null = null;
function ensurePortalRoot() {
  if (typeof document === "undefined") return null;
  if (!portalRoot) {
    portalRoot = document.getElementById("toast-root");
    if (!portalRoot) {
      portalRoot = document.createElement("div");
      portalRoot.id = "toast-root";
      Object.assign(portalRoot.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        pointerEvents: "none",
      });
      document.body.appendChild(portalRoot);
    }
  }
  return portalRoot;// src/components/ui/ProgressCelebration.tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

let portalRoot: HTMLElement | null = null;
function ensurePortalRoot() {
  if (typeof document === 'undefined') return null;
  if (!portalRoot) {
    portalRoot = document.getElementById('toast-root');
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'toast-root';
      Object.assign(portalRoot.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        pointerEvents: 'none',
      });
      document.body.appendChild(portalRoot);
    }
  }
  return portalRoot;
}

export default function ProgressCelebration() {
  const [toast, setToast] = useState<string | null>(null);
  const [confettiFn, setConfettiFn] = useState<((opts?: any) => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[Celebration] mounted');

    // Load confetti dynamically (client only)
    import('canvas-confetti')
      .then((m) => {
        const fn = (m as any).default || (m as any);
        setConfettiFn(() => fn);
        console.log('[Celebration] confetti loaded');
      })
      .catch((e) => {
        console.warn('[Celebration] confetti failed to load', e);
      });

    const burst = () => {
      if (!confettiFn) return;
      const end = Date.now() + 800;
      (function frame() {
        confettiFn!({
          particleCount: 6,
          startVelocity: 28,
          spread: 360,
          ticks: 50,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    };

    const showToast = (msg: string) => {
      setToast(msg);
      burst();
      setTimeout(() => setToast(null), 2400);
    };

    // Event: from TryIt (already wired in your component)
    const onTryIt = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      console.log('[Celebration] tryit:progress detail=', d);
      // Prefer explicit delta if provided; else show a generic reward
      const delta =
        typeof d.delta === 'number'
          ? d.delta
          : typeof d.earned === 'number' && typeof d.prev === 'number'
          ? d.earned - d.prev
          : null;

      if (typeof delta === 'number' && delta > 0) {
        showToast(`⭐ Progress +${delta.toFixed(1)} stars!`);
      } else {
        // Always celebrate a tryit:progress if it fires
        showToast('⭐ Progress updated!');
      }
    };

    // Event: from packs (your MDX → TryIt bridge)
    const onLuxPack = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      console.log('[Celebration] lux:pack-progress detail=', d);
      // Celebrate full pack pass. If ratio not provided, still celebrate.
      if (typeof d.ratio === 'number' && typeof d.weight === 'number') {
        if (d.ratio >= 1) {
          showToast(`⭐ +${(d.weight as number).toFixed(1)} stars earned!`);
        } else {
          // Partial progress—still show a small toast so user sees feedback
          showToast('⭐ Progress saved');
        }
      } else {
        // Unknown payload; still celebrate visibly
        showToast('⭐ Progress updated!');
      }
    };

    window.addEventListener('tryit:progress', onTryIt as any);
    document.addEventListener('lux:pack-progress', onLuxPack as any);
    return () => {
      window.removeEventListener('tryit:progress', onTryIt as any);
      document.removeEventListener('lux:pack-progress', onLuxPack as any);
    };
  }, [confettiFn]);

  if (!toast) return null;

  const root = ensurePortalRoot();
  if (!root) return null;

  return createPortal(
    <div
      style={{
        pointerEvents: 'auto',
        background: 'linear-gradient(90deg,#FFD700,#FFEA70)',
        color: '#222',
        padding: '8px 14px',
        borderRadius: 8,
        fontWeight: 800,
        boxShadow: '0 0 10px rgba(0,0,0,0.25)',
        animation: 'fadeUp 2.2s ease forwards',
      }}
    >
      {toast}
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(10px); }
          12% { opacity: 1; transform: translateY(0); }
          88% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </div>,
    root
  );
}

}

export default function ProgressCelebration() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    console.log("[ProgressCelebration] mounted"); // ✅ debug: see this in DevTools

    let confetti: any = null;
    // SSR-safe dynamic import of canvas-confetti
    import("canvas-confetti")
      .then((mod) => {
        confetti = (mod as any).default || mod;
        console.log("[ProgressCelebration] confetti loaded");
      })
      .catch(() => {
        console.warn("[ProgressCelebration] confetti failed to load (ok, toasts still work)");
      });

    // Initialize prev cache from storage to avoid firing on page load
    const preloadPrev = (chapterId: string) => {
      const keyPrev = `stars_prev:${chapterId}`;
      const keyCurr = `stars:${chapterId}`;
      const curr = localStorage.getItem(keyCurr);
      if (curr) {
        try {
          const parsed = JSON.parse(curr);
          localStorage.setItem(keyPrev, JSON.stringify({ earned: parsed.earned ?? 0 }));
        } catch {}
      }
    };

    const maybeCelebrate = (detail: any) => {
      if (!detail || !detail.chapterId) return;

      // Ensure prev cache exists the first time we hear about this chapter
      const keyPrev = `stars_prev:${detail.chapterId}`;
      if (!localStorage.getItem(keyPrev)) {
        preloadPrev(detail.chapterId);
      }

      const prevRaw = localStorage.getItem(keyPrev);
      const prevEarned = prevRaw ? JSON.parse(prevRaw).earned : 0;

      if (typeof detail.earned === "number" && detail.earned > prevEarned) {
        // persist new baseline
        localStorage.setItem(keyPrev, JSON.stringify({ earned: detail.earned }));

        // confetti burst (if loaded)
        if (confetti) {
          const duration = 900;
          const end = Date.now() + duration;
          (function frame() {
            confetti({
              particleCount: 5,
              startVelocity: 28,
              spread: 360,
              ticks: 50,
              origin: { x: Math.random(), y: Math.random() - 0.2 },
            });
            if (Date.now() < end) requestAnimationFrame(frame);
          })();
        }

        const delta = (detail.earned - prevEarned).toFixed(1);
        setToast(`⭐ Progress +${delta} stars!`);
        const t = setTimeout(() => setToast(null), 2600);
        return () => clearTimeout(t);
      }
    };

    // Listen on BOTH window (your TryIt uses this) and document (your other bus uses this)
    const onWindow = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log("[ProgressCelebration] tryit:progress", detail);
      maybeCelebrate(detail);
    };
    const onDoc = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      // normalize lux bus payload into {chapterId, earned, total}
      if (detail && detail.id && typeof detail.ratio === "number" && typeof detail.weight === "number") {
        const inc = detail.ratio === 1 ? detail.weight : 0; // only celebrate on full pack pass
        const key = `stars:${detail.id}`;
        const prev = localStorage.getItem(key);
        let earned = inc;
        let total = detail.weight || 3;
        if (prev) {
          try {
            const p = JSON.parse(prev);
            earned = Math.max(p.earned || 0, (p.earned || 0) + inc);
            total = p.total || total;
          } catch {}
        }
        console.log("[ProgressCelebration] lux:pack-progress", { id: detail.id, inc, earned, total });
        maybeCelebrate({ chapterId: detail.id, earned, total });
      }
    };

    window.addEventListener("tryit:progress", onWindow as any);
    document.addEventListener("lux:pack-progress", onDoc as any);

    return () => {
      window.removeEventListener("tryit:progress", onWindow as any);
      document.removeEventListener("lux:pack-progress", onDoc as any);
    };
  }, []);

  if (!toast) return null;

  const root = ensurePortalRoot();
  if (!root) return null;

  return createPortal(
    <div
      style={{
        pointerEvents: "auto",
        background: "linear-gradient(90deg,#FFD700,#FFEA70)",
        color: "#222",
        padding: "8px 14px",
        borderRadius: 8,
        fontWeight: 700,
        boxShadow: "0 0 10px rgba(0,0,0,0.25)",
        animation: "fadeUp 2.4s ease forwards",
      }}
    >
      {toast}
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(10px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </div>,
    root
  );
}
