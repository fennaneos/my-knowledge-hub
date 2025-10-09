import React, {useEffect, useRef} from 'react';

export default function TradingPage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current.querySelector('script[data-tv-adv]')) return;
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.setAttribute('data-tv-adv','1');
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'CRYPTO:BTCUSD',
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '2',
      locale: 'en',
      enable_publishing: false,
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      calendar: false,
      studies: ['STD;Bollinger%20Bands','STD;MACD'],
      support_host: 'https://www.tradingview.com',
    });
    const container = document.createElement('div');
    container.className = 'tradingview-widget-container';
    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    container.appendChild(widget);
    container.appendChild(script);
    ref.current.appendChild(container);
  }, []);

  return (
    <div style={{height: 'calc(100vh - var(--ifm-navbar-height))', padding: 8}}>
      <div ref={ref} style={{height: '100%'}} />
    </div>
  );
}
