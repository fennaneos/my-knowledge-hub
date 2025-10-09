import React, {useEffect, useRef} from 'react';

export default function MarketTape() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Avoid injecting twice
    if (ref.current.querySelector('script[data-tv]')) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.setAttribute('data-tv', '1');
    script.innerHTML = JSON.stringify({
      symbols: [
        {proName: 'FOREXCOM:EURUSD', title: 'EUR/USD'},
        {proName: 'FOREXCOM:USDJPY', title: 'USD/JPY'},
        {proName: 'OANDA:XAUUSD', title: 'Gold'},
        {proName: 'TVC:UKOIL', title: 'Brent'},
        {proName: 'NASDAQ:NDX', title: 'Nasdaq 100'},
        {proName: 'SP:SPX', title: 'S&P 500'},
        {proName: 'CRYPTO:BTCUSD', title: 'BTC/USD'},
        {proName: 'CRYPTO:ETHUSD', title: 'ETH/USD'},
      ],
      showSymbolLogo: true,
      colorTheme: 'dark',
      isTransparent: true,
      displayMode: 'adaptive',
      locale: 'en',
    });
    const container = document.createElement('div');
    container.className = 'tradingview-widget-container';
    const inner = document.createElement('div');
    inner.className = 'tradingview-widget-container__widget';
    container.appendChild(inner);
    container.appendChild(script);
    ref.current.appendChild(container);
  }, []);

  return <div ref={ref} />;
}
