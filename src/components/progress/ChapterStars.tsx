import React, { useMemo } from 'react';
import useChapterStars from '../progress/useChapterStars';

/**
 * Animated gold stars (0–3 with halves), driven by ProgressContext.
 *
 * Usage (MDX):
 *   import ChapterStars from '@site/src/components/ChapterStars';
 *   <ChapterStars chapterId="actions-indices" />
 */
export default function ChapterStars({
  chapterId,
  max = 3,
  size = 16, // px
  showLabel = false,
}: {
  chapterId: string;
  max?: number;
  size?: number;
  showLabel?: boolean;
}) {
  const { stars } = useChapterStars(chapterId); // float, e.g. 1.5

  // A stable unique prefix so clipPath IDs don’t collide across pages
  const idPrefix = useMemo(
    () => `cs-${chapterId.replace(/\W+/g, '-')}-${max}-${size}`,
    [chapterId, max, size]
  );

  return (
    <div
      aria-label={`Progress: ${stars} of ${max} stars`}
      title={`Progress: ${stars} / ${max}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        lineHeight: 0,
        userSelect: 'none',
      }}
    >
      {Array.from({ length: max }).map((_, i) => {
        // how much of THIS star is filled (0..1)
        const fill = Math.max(0, Math.min(1, stars - i));
        const rectId = `${idPrefix}-clip-${i}`;

        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            role="img"
            aria-hidden="true"
            style={{ display: 'block' }}
          >
            <defs>
              {/* clip rectangle that animates width for half/partial fill */}
              <clipPath id={rectId}>
                <rect
                  x="0"
                  y="0"
                  width={`${fill * 24}`}
                  height="24"
                  // smooth the fill change
                  style={{ transition: 'width 240ms ease' }}
                />
              </clipPath>
            </defs>

            {/* Base outline (empty star) */}
            <path
              d="M12 2.5l2.98 6.04 6.67.97-4.82 4.7 1.14 6.65L12 17.9 6.03 20.86l1.14-6.65-4.82-4.7 6.67-.97L12 2.5z"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
            />

            {/* Filled gold area, clipped horizontally */}
            <g clipPath={`url(#${rectId})`}>
              <path
                d="M12 2.5l2.98 6.04 6.67.97-4.82 4.7 1.14 6.65L12 17.9 6.03 20.86l1.14-6.65-4.82-4.7 6.67-.97L12 2.5z"
                fill="url(#gold-grad)"
                stroke="rgba(255,215,0,0.75)"
                strokeWidth="1"
              />
            </g>

            {/* gold gradient definition (one per SVG is fine) */}
            <defs>
              <linearGradient id="gold-grad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#b58e2f" />
                <stop offset="50%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#d4af37" />
              </linearGradient>
            </defs>
          </svg>
        );
      })}
      {showLabel && (
        <span style={{ color: '#cfcfcf', fontSize: 12 }}>{Number(stars).toFixed(1)} / {max}</span>
      )}
    </div>
  );
}
