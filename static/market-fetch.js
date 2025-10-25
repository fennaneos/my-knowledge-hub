// static/market-fetch.js
window.__MARKET_FETCH__ = async (symbol, days = 180) => {
  const r = await fetch(`/api/ohlc?symbol=${encodeURIComponent(symbol)}&days=${days}`);
  if (!r.ok) throw new Error('bad response');
  return r.json(); // -> { t:number[], c:number[] }
};
