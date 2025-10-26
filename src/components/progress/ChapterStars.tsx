// src/components/progress/ChapterStars.tsx
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  chapterId: string;
  showLabel?: boolean;
  starTotal?: number; // fallback if nothing in storage (default 3)
  size?: number;      // px per star (default 16)
  gap?: number;       // px between stars (default 4)
};

type Stored = {
  chapterId: string;
  earned: number; // may be fractional (e.g. 1.5)
  total: number;
  updatedAt: number;
};

const KEY = (id: string) => `stars:${id}`;

function readStored(id: string): Stored | null {
  try {
    const raw = localStorage.getItem(KEY(id));
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function StarSVG({ fill = 1, size = 16 }: { fill: number; size?: number }) {
  // fill in [0,1]; we clip the right-side to create a half (or partial) fill
  const width = size;
  const height = size;
  const clipId = useMemo(() => `clip-${Math.random().toString(36).slice(2)}`, []);
  const starPath =
    "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

  const filledWidth = Math.max(0, Math.min(1, fill)) * width;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {/* base (empty) */}
      <path d={starPath} fill="rgba(255,255,255,0.2)" />
      {/* filled clipped */}
      <clipPath id={clipId}>
        <rect x="0" y="0" width={filledWidth} height={height} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <path d={starPath} fill="#ffd700" />
      </g>
      {/* subtle stroke */}
      <path d={starPath} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    </svg>
  );
}

export default function ChapterStars({
  chapterId,
  showLabel = false,
  starTotal = 3,
  size = 16,
  gap = 4,
}: Props) {
  const [earned, setEarned] = useState<number>(0);
  const [total, setTotal] = useState<number>(starTotal);

  useEffect(() => {
    const sync = () => {
      const s = readStored(chapterId);
      if (s) {
        setEarned(s.earned ?? 0);
        setTotal(s.total ?? starTotal);
      } else {
        setEarned(0);
        setTotal(starTotal);
      }
    };

    // initial
    sync();

    // listen to both event buses + storage (cross-tab)
    const onTryIt = () => sync();
    const onLux = () => sync();
    window.addEventListener("tryit:progress", onTryIt as any);
    document.addEventListener("lux:pack-progress", onLux as any);
    window.addEventListener("storage", onTryIt as any);

    return () => {
      window.removeEventListener("tryit:progress", onTryIt as any);
      document.removeEventListener("lux:pack-progress", onLux as any);
      window.removeEventListener("storage", onTryIt as any);
    };
  }, [chapterId, starTotal]);

  // Build an array of per-star fill ratios (e.g. [1, 0.5, 0, ...])
  const perStar = useMemo(() => {
    const t = Math.max(1, Math.round(total));
    const arr: number[] = [];
    let rem = Math.max(0, Math.min(total, earned));
    for (let i = 0; i < t; i++) {
      arr.push(Math.max(0, Math.min(1, rem)));
      rem -= 1;
    }
    return arr;
  }, [earned, total]);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "inline-flex", gap }}>
        {perStar.map((f, i) => (
          <StarSVG key={i} fill={f} size={size} />
        ))}
      </div>
      {showLabel && (
        <small style={{ opacity: 0.85 }}>
          {earned.toFixed(1)} / {total}
        </small>
      )}
    </div>
  );
}
