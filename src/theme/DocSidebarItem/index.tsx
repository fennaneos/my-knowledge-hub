import React from 'react';
import OriginalSidebar from '@theme-original/DocSidebar';
import type {Props} from '@theme/DocSidebar';
import MarketTape from '@site/src/components/market/MarketTape';
import styles from './luxSidebar.module.css';

/**
 * Wrapper around the whole sidebar.
 * - Box 1: Markets (your trading view / tape)
 * - Box 2: Documentation (the original sidebar)
 */
export default function DocSidebar(props: Props): JSX.Element {
  return (
    <div className={styles.sidebarStack}>
      {/* Markets box */}
      <div className={styles.box}>
        <div className={styles.boxHeader}><span>Markets</span></div>
        <div className={styles.boxBody}>
          <MarketTape />
        </div>
      </div>

      {/* Documentation box (original sidebar) */}
      <div className={styles.box}>
        <div className={styles.boxHeader}><span>Documentation</span></div>
        <div className={styles.boxBody} style={{padding: 0}}>
          <OriginalSidebar {...props} />
        </div>
      </div>
    </div>
  );
}
