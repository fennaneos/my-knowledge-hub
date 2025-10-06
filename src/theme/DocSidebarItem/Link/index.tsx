// src/theme/DocSidebarItem/Link/index.tsx
import React, { useEffect, useMemo, useState } from 'react';
import OriginalLink from '@theme-original/DocSidebarItem/Link';
import type { Props } from '@theme/DocSidebarItem/Link';
import { useProgress } from '@site/src/components/progress/ProgressContext';

function chapterIdFromItem(item: Props['item']): string | null {
  // Prefer docId if available; else make one from href
  // @ts-ignore - docusaurus types vary; keep it robust
  const docId = item.docId ?? item.docIdString ?? null;
  if (docId) return String(docId);
  const href = (item as any)?.href as string | undefined;
  if (!href) return null;
  // /docs/foo/bar -> foo/bar
  return href.replace(/^\/+/, '').replace(/\/+$/, '');
}

export default function Link(props: Props): JSX.Element {
  const id = chapterIdFromItem(props.item);
  const { get } = useProgress();
  const [shadow, setShadow] = useState(0);
  const prog = useMemo(() => (id ? get(id) : undefined), [id, get]);

  // listen to global progress updates (if user completes elsewhere)
  useEffect(() => {
    function onEvt(e: any) {
      if (!id || !e?.detail?.id || e.detail.id !== id) return;
      // bump a small shimmer pulse
      setShadow(s => s + 1);
      const t = setTimeout(() => setShadow(s => s + 1), 550);
      return () => clearTimeout(t);
    }
    document.addEventListener('lux:progress', onEvt);
    return () => document.removeEventListener('lux:progress', onEvt);
  }, [id]);

  // visual values
  const ratio = Math.max(0, Math.min(1, prog?.ratio ?? 0));
  const stars = Math.max(0, Math.min(3, prog?.stars ?? 0));
  const percent = Math.round(ratio * 100);

  return (
    <div style={{ position: 'relative' }}>
      <OriginalLink {...props} />
      {/* Gauge line under the link text */}
      <div
        className="lux-gauge"
        data-pulse={shadow}
        aria-label={id ? `Progress ${percent}%` : undefined}
        style={{
          '--p': `${percent}%`,
        } as React.CSSProperties}
      >
        <div className="lux-gauge__track" />
        <div className="lux-gauge__fill" />
      </div>

      {/* Stars to the right */}
      <div className="lux-stars" aria-hidden="true">
        <span className={stars >= 1 ? 'on' : ''}>★</span>
        <span className={stars >= 2 ? 'on' : ''}>★</span>
        <span className={stars >= 3 ? 'on' : ''}>★</span>
      </div>
    </div>
  );
}
