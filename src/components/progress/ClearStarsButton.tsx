// src/components/progress/ClearStarsButton.tsx
import React, {useEffect, useRef, useState} from 'react';
import { useProgress } from './ProgressContext';

type Props = { chapterId: string };

export default function ClearStarsButton({ chapterId }: Props) {
  const { clear } = useProgress();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Fermer avec ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Clic en dehors
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!sheetRef.current) return;
      if (!sheetRef.current.contains(e.target as Node)) {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const onConfirm = () => {
    // Reset du chapitre
    clear?.(chapterId);
    // Toast “reset” existant (RewardToaster)
    document.dispatchEvent(
      new CustomEvent('lux:reward', {
        detail: { type: 'reset', id: chapterId, label: 'Progress reset ✨' },
      })
    );
    setOpen(false);
    btnRef.current?.focus();
  };

  return (
    <>
      {/* Bouton déclencheur */}
      <button
        ref={btnRef}
        className="button"
        onClick={() => setOpen(true)}
        style={{
          borderRadius: 10,
          padding: '6px 10px',
          border: '1px solid var(--gold-faint)',
          background: 'rgba(255,255,255,0.05)',
          fontSize: 12,
          whiteSpace: 'nowrap',
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="lux-clear-stars-dialog"
      >
        🧹 Clear Stars
      </button>

      {/* Overlay + panneau de confirmation */}
      {open && (
        <div className="lux-confirm-overlay" aria-hidden={!open}>
          <div
            id="lux-clear-stars-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Reset chapter progress"
            className="lux-confirm-sheet"
            ref={sheetRef}
          >
            <div className="lux-confirm-header">
              <span className="lux-confirm-icon">✨</span>
              <strong>Reset progress?</strong>
            </div>
            <p className="lux-confirm-text">
              This will set stars to <b>0</b> for this chapter. You can earn them again by re-running the tests.
            </p>
            <div className="lux-confirm-actions">
              <button
                className="button"
                onClick={() => {
                  setOpen(false);
                  btnRef.current?.focus();
                }}
                style={{
                  borderRadius: 10,
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--gold-faint)',
                }}
              >
                Cancel
              </button>
              <button
                className="button button--primary"
                onClick={onConfirm}
                style={{ borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles locaux */}
      <style>{`
        .lux-confirm-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          pointer-events: none; /* l'overlay ne bloque pas la page; on capte le clic via mousedown global */
        }
        .lux-confirm-sheet {
          position: fixed;
          right: 18px;
          top: calc(var(--ifm-navbar-height, 64px) + 18px);
          width: min(360px, 92vw);
          background: rgba(15, 18, 23, 0.78);
          border: 1px solid var(--gold-faint);
          border-radius: 14px;
          box-shadow: 0 10px 28px rgba(0,0,0,0.45), 0 0 1.2rem rgba(255,215,0,.10);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 14px 14px 12px;
          transform: translateX(16px);
          opacity: 0;
          animation: luxSlideIn .22s ease forwards;
          pointer-events: auto; /* le panneau, lui, capte les clics */
        }
        @keyframes luxSlideIn {
          to { transform: translateX(0); opacity: 1; }
        }
        .lux-confirm-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          color: #fff;
        }
        .lux-confirm-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px; height: 26px;
          border-radius: 999px;
          background: radial-gradient(100% 100% at 50% 0, rgba(255,215,0,0.25), rgba(255,255,255,0));
          border: 1px solid var(--gold-faint);
          box-shadow: 0 0 10px rgba(255,215,0,.25);
        }
        .lux-confirm-text {
          margin: 0 0 12px 0;
          color: #e6edf3;
          font-size: 0.95rem;
        }
        .lux-confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
      `}</style>
    </>
  );
}
