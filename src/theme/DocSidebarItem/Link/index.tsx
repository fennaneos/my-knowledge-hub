// src/theme/DocSidebarItem/Link/index.tsx
import React, { useEffect, useState } from 'react';
import OriginalLink from '@theme-original/DocSidebarItem/Link';
import type { Props } from '@theme/DocSidebarItem/Link';
import { useProgress } from '@site/src/components/progress/ProgressContext';
import ChapterStars from '@site/src/components/progress/ChapterStars';

/** Return a normalized chapter key that matches what <TryIt chapterId="..."> uses.
 *  - Prefer item.docId if present (Docusaurus v3)
 *  - Else derive from href
 *  - Normalize to the last segment, lowercased (e.g., "finance/Actions-indices" -> "actions-indices")
 */
function chapterKeyFromItem(item: Props['item']): string | null {
  // @ts-ignore — docusaurus versions differ
  const docId: string | undefined = item.docId ?? item.docIdString ?? undefined;
  const takeLast = (s: string) => (s.split('/').filter(Boolean).pop() || '').toLowerCase();

  if (docId) return takeLast(docId);

  const href = (item as any)?.href as string | undefined;
  if (!href) return null;

  // strip query/hash, trailing slashes, take last path piece
  const clean = href.split('#')[0].split('?')[0].replace(/\/+$/, '');
  return takeLast(clean);
}

export default function Link(props: Props): JSX.Element {
  const chapterKey = chapterKeyFromItem(props.item);

  const { all } = useProgress();          // read live map so updates re-render
  const prog = chapterKey ? all[chapterKey] : undefined;

  // tiny shimmer pulse when this specific chapter updates
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!chapterKey) return;
    const onEvt = (e: any) => {
      if (e?.detail?.id?.toLowerCase?.() !== chapterKey) return;
      setPulse(p => p + 1);
    };
    document.addEventListener('lux:progress', onEvt);
    return () => document.removeEventListener('lux:progress', onEvt);
  }, [chapterKey]);

  const ratio = Math.max(0, Math.min(1, prog?.ratio ?? 0));
  const percent = Math.round(ratio * 100);

  // --- Debug once to confirm keys line up
  // console.debug('[SidebarStars]', { chapterKey, prog });

  return (
    <div style={{ position: 'relative' }}>
      <OriginalLink {...props} />

      {/* Gauge line under link */}
      <div
        className="lux-gauge"
        data-pulse={pulse}
        aria-label={chapterKey ? `Progress ${percent}%` : undefined}
        style={{ ['--p' as any]: `${percent}%` }}
      >
        <div className="lux-gauge__track" />
        <div className="lux-gauge__fill" />
      </div>

      {/* Animated gold stars to the right */}
      {chapterKey && (
        <div className="lux-stars" aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
          <ChapterStars chapterId={chapterKey} size={14} />
        </div>
      )}
    </div>
  );
}
