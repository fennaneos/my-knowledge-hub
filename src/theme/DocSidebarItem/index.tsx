import React, {useEffect, useRef, useState, useMemo} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Link from '@docusaurus/Link';
import {useAllDocsData} from '@docusaurus/plugin-content-docs/client';
import useBaseUrl from '@docusaurus/useBaseUrl';


import MarketTape from '@site/src/components/market/MarketTape';
import ChapterStars from '@site/src/components/progress/ChapterStars';
import styles from './LuxSidebar.module.css';

// CommonJS sidebars.js (don’t use `import default`)
const sidebars = require('@site/sidebars');

type SidebarItem =
  | string
  | {
      type: 'doc' | 'category';
      id?: string;
      label?: string;
      items?: SidebarItem[];
      collapsed?: boolean;
    };

/* ---------- Helpers ---------- */

// Prettify “finance/monte-carlo” -> “Monte Carlo”
function prettyLabel(idOrLabel: string) {
  const last = (idOrLabel.split('/').pop() ?? idOrLabel).replace(/[-_]+/g, ' ');
  return last.replace(/\b\w/g, (m) => m.toUpperCase());
}

// Normalize for your stars (matches your MDX usage like "actions-indices")
const normalizeChapterId = (id: string) => (id.split('/').pop() || id).toLowerCase();

// Build a robust link resolver once per render from all docs data
function useDocPermalinkResolver() {
  const all = useAllDocsData();

  const index = useMemo(() => {
    const map = new Map<string, string>(); // key -> permalink
    const add = (k: string | undefined | null, href: string) => {
      if (!k) return;
      map.set(k, href);
      map.set(k.toLowerCase(), href);
    };

    for (const pluginId of Object.keys(all)) {
      const {versions} = all[pluginId];
      const ordered = [...versions.filter(v => v.isActive), ...versions.filter(v => !v.isActive)];
      for (const v of ordered) {
        for (const d of v.docs) {
          const href = d.permalink;
          if (!href) continue;

          // direct ids
          add(d.id, href);
          add(d.unversionedId, href);

          // last segment variants
          add(d.id?.split('/').pop(), href);
          add(d.unversionedId?.split('/').pop(), href);

          // dir/last variant (e.g., finance/monte-carlo)
          const id2 = d.id?.toLowerCase();
          if (id2 && id2.includes('/')) add(id2.split('/').slice(-2).join('/'), href);
          const unv2 = d.unversionedId?.toLowerCase();
          if (unv2 && unv2.includes('/')) add(unv2.split('/').slice(-2).join('/'), href);

          // source path endings as a last resort
          const src = (d.source || '').toLowerCase();
          if (src.endsWith('.mdx') || src.endsWith('.md')) {
            const noExt = src.replace(/\.mdx?$/, '');
            add(noExt.split('/').pop(), href);                 // monte-carlo
            add(noExt.split('/').slice(-2).join('/'), href);   // finance/monte-carlo
          }
        }
      }
    }
    return map;
  }, [all]);

  return (rawId?: string) => {
    if (!rawId) return undefined;
    const exact = index.get(rawId);
    if (exact) return exact;

    const lc = rawId.toLowerCase();
    return (
      index.get(lc) ||
      index.get(lc.split('/').pop()!) ||
      index.get(lc.includes('/') ? lc.split('/').slice(-2).join('/') : lc)
    );
  };
}


function TitleWithStars({id, label}: {id: string; label?: string}) {
  // If you kept the resolver, use it; otherwise this will be undefined
  const hrefResolved = typeof useDocPermalinkResolver === 'function'
    ? useDocPermalinkResolver()(id)
    : undefined;

  const base = id;                       // e.g. "finance/Actions-indices"
  const baseLc = base.toLowerCase();     //       "finance/actions-indices"
  const last = (base.split('/').pop() || base);      // "Actions-indices"
  const lastLc = last.toLowerCase();                 // "actions-indices"

  // Build robust candidates; useBaseUrl will prepend baseUrl correctly
  const candidates = [
    hrefResolved,                          // best: registry-resolved
    useBaseUrl(`${base}`),           // classic
    useBaseUrl(`${baseLc}`),         // lower-cased full id
    useBaseUrl(`/${base}`),                // routeBasePath = '/'
    useBaseUrl(`/${baseLc}`),              // lowercase for '/'
    useBaseUrl(`/docs/${last}`),           // flattened file name
    useBaseUrl(`/docs/${lastLc}`),         // flattened lower-case
    useBaseUrl(`/${last}`),                // flattened at '/'
    useBaseUrl(`/${lastLc}`),              // flattened lower-case at '/'
  ].filter(Boolean) as string[];

  const href = candidates[0]!;
  const text =
    label ??
    last.replace(/[-_]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  const chapterId = (lastLc); // matches your ChapterStars usage

  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
      <a href={href} style={{ textDecoration:'none' }}>{text}</a>
      <ChapterStars chapterId={chapterId} />
    </div>
  );
}


function RenderItems({items}: {items: SidebarItem[]}) {
  return (
    <ul style={{margin: 0, padding: '8px 12px', listStyle: 'none'}}>
      {items.map((item, idx) => {
        if (typeof item === 'string') {
          return (
            <li key={item} style={{margin: '6px 0'}}>
              <TitleWithStars id={item} />
            </li>
          );
        }
        if (item.type === 'doc' && item.id) {
          return (
            <li key={item.id} style={{margin: '6px 0'}}>
              <TitleWithStars id={item.id} label={item.label} />
            </li>
          );
        }
        if (item.type === 'category' && item.items) {
          const key = `${item.label ?? 'Category'}-${idx}`;
          return (
            <li key={key} style={{margin: '8px 0'}}>
              <details open={item.collapsed === false}>
                <summary style={{cursor: 'pointer', fontWeight: 600}}>
                  {item.label ?? 'Category'}
                </summary>
                <RenderItems items={item.items} />
              </details>
            </li>
          );
        }
        return null;
      })}
    </ul>
  );
}

function SidebarChrome({children}: {children: React.ReactNode}) {
  return (
    <div className={styles.sidebarStack}>
      <div className={styles.box}>
        <div className={styles.boxHeader}><span>Markets</span></div>
        <div className={styles.boxBody}>
          <BrowserOnly>{() => <MarketTape />}</BrowserOnly>
        </div>
      </div>

      <div className={styles.box}>
        <div className={styles.boxHeader}><span>Documentation</span></div>
        <div className={styles.boxBody} style={{padding: 0}}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DocSidebar() {
  const tutorial: SidebarItem[] = Array.isArray(sidebars?.tutorialSidebar) ? sidebars.tutorialSidebar : [];
  const hasItems = tutorial.length > 0;

  // Render only once in the main desktop sidebar container
  const [mounted, setMounted] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const host = hostRef.current;
    if (!host) return;
    const container = host.closest('.theme-doc-sidebar-container');
    if (!container) return setIsPrimary(false);
    const all = Array.from(container.querySelectorAll('[data-lux-doc-sidebar="1"]'));
    setIsPrimary(all[0] === host);
  }, [mounted]);

  if (!mounted) return <div ref={hostRef} data-lux-doc-sidebar="1" style={{display: 'none'}} />;

  if (!hasItems) return <div ref={hostRef} data-lux-doc-sidebar="1" style={{display: 'none'}} />;

  return (
    <div ref={hostRef} data-lux-doc-sidebar="1">
      {isPrimary ? (
        <SidebarChrome>
          <RenderItems items={tutorial} />
        </SidebarChrome>
      ) : null}
    </div>
  );
}
