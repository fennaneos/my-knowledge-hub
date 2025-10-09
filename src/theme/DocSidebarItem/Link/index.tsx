import React, {useEffect, useState} from 'react';
import OriginalLink from '@theme-original/DocSidebarItem/Link';
import type {Props} from '@theme/DocSidebarItem/Link';
import {useDocById} from '@docusaurus/plugin-content-docs/client';
import {useProgress} from '@site/src/components/progress/ProgressContext';
import ChapterStars from '@site/src/components/progress/ChapterStars';

/** Normalize a key to match what <TryIt chapterId="..."> emits. */
function chapterKeyFromItem(item: Props['item']): {key: string | null; docId?: string} {
  // @ts-ignore – docusaurus versions differ
  const docId: string | undefined = item.docId ?? item.docIdString ?? undefined;
  const takeLast = (s: string) => (s.split('/').filter(Boolean).pop() || '').toLowerCase();

  if (docId) return {key: takeLast(docId), docId};

  const href = (item as any)?.href as string | undefined;
  if (!href) return {key: null};
  if (href === '/' || href === '/docs' || href === '/docs/') return {key: 'intro'};

  const clean = href.split('#')[0].split('?')[0].replace(/\/+$/, '');
  return {key: takeLast(clean)};
}

/**
 * Per-link override:
 * - Renders the original link
 * - Optional Premium badge (front-matter "premium": true, optional "badge": "Text")
 * - Progress gauge + stars (unless hidden by hideStars)
 *   * hideStars priority: front-matter > customProps > window.__LUX_HIDE_STARS[chapterKey]
 */
export default function Link(props: Props): JSX.Element {
  const {key: chapterKey, docId} = chapterKeyFromItem(props.item);

  // Read front-matter of the target doc (to get flags like premium/hideStars)
  const doc = docId ? useDocById(docId) : undefined;
  const fm: any = doc?.frontMatter ?? {};
  const custom = (props.item as any)?.customProps ?? {};

  const premium = !!(fm.premium ?? custom.premium);
  const badgeText: string = fm.badge ?? custom.badge ?? 'Premium';

  // Hide-stars flags: front-matter, customProps, or global window flag set by a page script
  const fmHide = !!fm.hideStars;
  const sidebarHide = !!custom.hideStars;
  const globalHide =
    typeof window !== 'undefined' && chapterKey
      ? !!(window as any).__LUX_HIDE_STARS?.[chapterKey]
      : false;
  const hideStars = fmHide || sidebarHide || globalHide;

  // Progress (to render gauge/stars)
  const {all} = useProgress();
  const prog = chapterKey ? all[chapterKey] : undefined;

  // tiny pulse when this chapter updates
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!chapterKey) return;
    const onEvt = (e: any) => {
      if (e?.detail?.id?.toLowerCase?.() !== chapterKey) return;
      setPulse((p) => p + 1);
    };
    document.addEventListener('lux:progress', onEvt);
    return () => document.removeEventListener('lux:progress', onEvt);
  }, [chapterKey]);

  const ratio = Math.max(0, Math.min(1, prog?.ratio ?? 0));
  const percent = Math.round(ratio * 100);

  return (
    <div
      style={{position: 'relative'}}
      data-hidestars={hideStars ? '1' : undefined}
      data-premium={premium ? '1' : undefined}
    >
      <OriginalLink {...props} />

      {/* Premium badge */}
      {premium && (
        <span className="lux-badge lux-badge--premium" aria-label="Premium">
          {badgeText}
        </span>
      )}

      {/* Gauge + stars (skip if hidden) */}
      {!hideStars && (
        <>
          <div
            className="lux-gauge"
            data-pulse={pulse}
            aria-label={chapterKey ? `Progress ${percent}%` : undefined}
            style={{['--p' as any]: `${percent}%`}}
          >
            <div className="lux-gauge__track" />
            <div className="lux-gauge__fill" />
          </div>

          {chapterKey && (
            <div
              className="lux-stars"
              aria-hidden="true"
              style={{display: 'flex', alignItems: 'center'}}
            >
              <ChapterStars chapterId={chapterKey} size={14} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
