import React, {useEffect, useRef, useState} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {useWindowSize} from '@docusaurus/theme-common';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';

import MarketTape from '@site/src/components/market/MarketTape';
import styles from './luxSidebar.module.css';

// CommonJS sidebars.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sidebars = require('@site/sidebars');

// ---- Minimal recursive renderer for sidebars.js data ----
type SidebarItem =
  | string
  | { type: 'doc' | 'category'; id?: string; label?: string; items?: SidebarItem[]; collapsed?: boolean };

function DocLink({id, label}: {id: string; label?: string}) {
  const url = useBaseUrl(`/docs/${id}`);
  return <Link to={url}>{label ?? id}</Link>;
}

function RenderItems({items}: {items: SidebarItem[]}) {
  return (
    <ul style={{margin: 0, padding: '8px 12px', listStyle: 'none'}}>
      {items.map((item, idx) => {
        if (typeof item === 'string') {
          return (
            <li key={item} style={{margin: '6px 0'}}>
              <DocLink id={item} />
            </li>
          );
        }
        if (item.type === 'doc' && item.id) {
          return (
            <li key={item.id} style={{margin: '6px 0'}}>
              <DocLink id={item.id} label={item.label} />
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

export default function DocSidebar() {
  const tutorial: SidebarItem[] = Array.isArray(sidebars?.tutorialSidebar) ? sidebars.tutorialSidebar : [];
  const hasItems = tutorial.length > 0;

  // Only render the FIRST *visible* desktop mount
  const win = useWindowSize(); // 'desktop' | 'mobile' | 'ssr'
  const isDesktop = win === 'desktop' || win === 'ssr';

  const ref = useRef<HTMLDivElement | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    if (!isDesktop) return; // we only show the fancy chrome on desktop
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;

    // only consider visible mounts
    const isVisible = !!el.offsetParent;
    if (!isVisible) {
      setIsPrimary(false);
      return;
    }

    // render only once per page load, in the first visible mount
    if (!(window as any).__LUX_PRIMARY_SIDEBAR_RENDERED) {
      (window as any).__LUX_PRIMARY_SIDEBAR_RENDERED = true;
      setIsPrimary(true);
    } else {
      setIsPrimary(false);
    }
  }, [isDesktop]);

  // Mobile & off-canvas: render nothing (prevents duplicates)
  if (!isDesktop) {
    return null;
  }

  // Desktop but not the primary visible mount: render nothing
  if (!isPrimary) {
    return <div ref={ref} data-lux-doc-sidebar="" style={{display: 'none'}} />;
  }

  if (!hasItems) return null;

  return (
    <div ref={ref} data-lux-doc-sidebar="" className={styles.sidebarStack}>
      <div className={styles.box}>
        <div className={styles.boxHeader}><span>Markets</span></div>
        <div className={styles.boxBody}>
          <BrowserOnly>{() => <MarketTape />}</BrowserOnly>
        </div>
      </div>

      <div className={styles.box}>
        <div className={styles.boxHeader}><span>Documentation</span></div>
        <div className={styles.boxBody} style={{padding: 0}}>
          <RenderItems items={tutorial} />
        </div>
      </div>
    </div>
  );
}
