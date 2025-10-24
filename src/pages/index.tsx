// src/pages/index.tsx
import React, {useEffect, useRef} from 'react';
import Layout from '@theme/Layout';
import MarketTape from '@site/src/components/market/MarketTape'; // you already have this
import styles from './tradingHome.module.css';

// --- Simple TradingView embed (free widget) ---
// It injects the TradingView script on client and mounts a chart.
function TradingViewChart({
  symbol = 'NASDAQ:AAPL',
  theme = 'dark',
  autosize = true,
  interval = 'D',
  studies = ['MACD@tv-basicstudies', 'RSI@tv-basicstudies'],
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Avoid injecting the script twice
    const scriptId = 'tv-widget-script';
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = 'https://s3.tradingview.com/tv.js';
      s.async = true;
      document.body.appendChild(s);
      s.onload = () => init();
    } else {
      // Script already present
      init();
    }

    function init() {
      // @ts-ignore
      if (!window.TradingView || !containerRef.current) return;
      // Clean previous
      containerRef.current.innerHTML = '';
      // @ts-ignore
      new window.TradingView.widget({
        symbol,
        interval,
        autosize,
        theme,
        timezone: 'Etc/UTC',
        style: '1',
        locale: 'en',
        allow_symbol_change: true,
        studies,
        container_id: containerRef.current.id,
        backgroundColor: '#0b0e14',
      });
    }
  }, [symbol, theme, autosize, interval, studies]);

  return <div id="tv_chart_container" ref={containerRef} className={styles.chartCard} />;
}

export default function TradingHome(): JSX.Element {
  return (
    <Layout
      title="Trading View"
      description="Live market look & equity dashboard"
    >
      <div className={styles.heroRoot}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Markets Dashboard</h1>
          <p className={styles.heroTag}>
            Realtime tickers, a premium dark chart, and a quick equity watchlist.
          </p>
<div className="cta-group">
  <a className="btn-neo-blue" href="/">Home</a>
  <a className="btn-ghost-blue" href="/finance/Actions-indices">Finance Courses</a>
  <a className="btn-ghost-blue" href="/premium/volatility-handbook">Premium Courses</a>
  <a className="btn-ghost-blue" href="/lab">
    Open Lab <span className="badge-new">NEW</span>
  </a>
</div>

{/* newline section */}
<div className="cta-group cta-pro-line">
  <a className="btn-neo-red-modern" href="/pricing-labs">Get Pro</a>
</div>

        </div>
      </div>

      <main className={styles.mainWrap}>
        {/* Top box: Tickers / tape */}
        <section className={styles.box}>
          <div className={styles.boxHeader}><span>Market Tape</span></div>
          <div className={styles.boxBody}>
            <MarketTape />
          </div>
        </section>

        {/* Grid: Big chart + watchlist */}
        <section className={styles.grid2}>
          <div className={styles.box}>
            <div className={styles.boxHeader}><span>Equity Chart</span></div>
            <div className={styles.boxBody} style={{padding: 0}}>
              <TradingViewChart symbol="NASDAQ:AAPL" />
            </div>
          </div>

          <div className={styles.box}>
            <div className={styles.boxHeader}><span>Watchlist</span></div>
            <div className={styles.boxBody}>
              <ul className={styles.watchlist}>
                {[
                  {sym: 'NASDAQ:AAPL', name: 'Apple'},
                  {sym: 'NASDAQ:MSFT', name: 'Microsoft'},
                  {sym: 'NASDAQ:NVDA', name: 'NVIDIA'},
                  {sym: 'NASDAQ:GOOGL', name: 'Alphabet'},
                  {sym: 'NYSE:BRK.B', name: 'Berkshire B'},
                  {sym: 'NYSE:JPM', name: 'JPMorgan'},
                ].map((s) => (
                  <li key={s.sym} className={styles.watchRow}>
                    <span className={styles.sym}>{s.sym}</span>
                    <span className={styles.nm}>{s.name}</span>
                    {/* Optional: quick-link to open in TradingView */}
                    <a
                      className={styles.badge}
                      href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(s.sym)}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Open in TradingView"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
              <div className={styles.disclaimer}>
                Data by TradingView widget (free). For production-grade data, see options below.
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
