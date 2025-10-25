// api/ohlc.ts (Vercel)
import type { VercelRequest, VercelResponse } from '@vercel/node';

function gbm(days = 180, s0 = 100) {
  const t:number[] = [], c:number[] = [];
  const start = Date.now() - days * 86400000;
  let s = s0;
  for (let i=0;i<days;i++){
    const u1 = Math.random(), u2 = Math.random();
    const z = Math.sqrt(-2*Math.log(u1)) * Math.cos(2*Math.PI*u2);
    const mu = 0.10, sigma = 0.25;
    const ret = (mu - 0.5*sigma*sigma)/252 + sigma*Math.sqrt(1/252)*z;
    s *= Math.exp(ret);
    t.push(start + i*86400000);
    c.push(s);
  }
  return { t, c };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const symbol = String(req.query.symbol || 'DEMO');
  const days = Math.max(30, Math.min(720, parseInt(String(req.query.days || '180'))));
  // TODO: replace GBM with a real data call (Polygon, Tiingo, etc.)
  const base = /USD|USDT|SOFR|EURIBOR/.test(symbol) ? 1 : 100 + Math.random()*80;
  const out = gbm(days, base);
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.status(200).json(out);
}
