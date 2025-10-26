// src/components/progress/ClearStarsButton.tsx
import React from "react";

export default function ClearStarsButton({ chapterId }: { chapterId: string }) {
  const clear = () => {
    const key = `stars:${chapterId}`;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ chapterId, earned: 0, total: 3, updatedAt: Date.now() })
      );
    } catch {}
    // Notify any listeners so UI refreshes instantly
    try {
      window.dispatchEvent(
        new CustomEvent("tryit:progress", {
          detail: { chapterId, earned: 0, total: 3, updatedAt: Date.now() },
        })
      );
    } catch {}
  };

  return (
    <button className="btn-wire" onClick={clear} title="Clear star progress for this chapter">
      Clear Stars
    </button>
  );
}
