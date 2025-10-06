// src/components/progress/ClearStarsButton.tsx
import React from 'react';
import { useProgress } from './ProgressContext';

export default function ClearStarsButton({ chapterId }: { chapterId: string }) {
  const { clear } = useProgress();
  const onClick = () => {
    if (confirm('Reset progress for this chapter?')) {
      clear(chapterId);
      document.dispatchEvent(
        new CustomEvent('lux:reward', {
          detail: { type: 'reset', id: chapterId, label: 'Progress reset ✨' },
        })
      );
    }
  };
  return (
    <button
      className="button"
      onClick={onClick}
      style={{
        borderRadius: 10,
        padding: '6px 10px',
        border: '1px solid var(--gold-faint)',
        background: 'rgba(255,255,255,0.05)',
        fontSize: 12,
        whiteSpace: 'nowrap',
      }}
    >
      🧹 Clear Stars
    </button>
  );
}
