import { normCdf, normPdf } from "../core/math";

export type BSIn = {
  s: number; k: number; r: number; q?: number; vol: number; t: number; call: boolean;
};
export type BSOut = { price: number; delta: number; gamma: number; vega: number; theta: number; rho: number };

// utils/bs.ts
const Nd = (x:number)=>0.5*(1+Math.erf(x/Math.SQRT2));
const pd = (x:number)=>Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);

export function bs(S:number,K:number,r:number,q:number,vol:number,T:number){
  const df = Math.exp(-r*T), dq = Math.exp(-q*T), sv = vol*Math.sqrt(T);
  const d1 = (Math.log(S/K)+(r-q+0.5*vol*vol)*T)/sv;
  const d2 = d1 - sv;
  const call = S*dq*Nd(d1) - K*df*Nd(d2);
  const put  = K*df*Nd(-d2) - S*dq*Nd(-d1);
  const gamma = dq*pd(d1)/(S*sv);
  const vega  = S*dq*pd(d1)*Math.sqrt(T); // per 1.00 vol
  const deltaC = dq*Nd(d1), deltaP = dq*(Nd(d1)-1);
  const thetaC = -(S*dq*pd(d1)*vol)/(2*Math.sqrt(T)) - r*K*df*Nd(d2) + q*S*dq*Nd(d1);
  const thetaP = -(S*dq*pd(d1)*vol)/(2*Math.sqrt(T)) + r*K*df*Nd(-d2) - q*S*dq*Nd(-d1);
  const rhoC = K*T*df*Nd(d2), rhoP = -K*T*df*Nd(-d2);
  return {call, put, deltaC, deltaP, gamma, vega, thetaC, thetaP, rhoC, rhoP, d1, d2};
}


export function blackScholes(in_: BSIn): BSOut {
  const { s, k, r, q = 0, vol, t, call } = in_;
  if (t <= 0 || vol <= 0) {
    const intrinsic = Math.max((call ? s - k : k - s), 0);
    return { price: intrinsic, delta: call ? (s > k ? 1 : 0) : (s < k ? -1 : 0), gamma: 0, vega: 0, theta: 0, rho: 0 };
  }
  const sqt = Math.sqrt(t);
  const d1 = (Math.log(s / k) + (r - q + 0.5 * vol * vol) * t) / (vol * sqt);
  const d2 = d1 - vol * sqt;
  const df = Math.exp(-r * t), dq = Math.exp(-q * t);

  const Nd1 = normCdf((call ? 1 : -1) * d1);
  const Nd2 = normCdf((call ? 1 : -1) * d2);
  const price = call ? dq * s * normCdf(d1) - df * k * normCdf(d2)
                     : df * k * normCdf(-d2) - dq * s * normCdf(-d1);

  const delta = call ? dq * normCdf(d1) : dq * (normCdf(d1) - 1);
  const gamma = (dq * normPdf(d1)) / (s * vol * sqt);
  const vega  = s * dq * normPdf(d1) * sqt * 0.01; // per 1% vol
  const theta = ( - (s * dq * normPdf(d1) * vol) / (2 * sqt)
                  + (call ? -r * df * k * normCdf(d2) + q * dq * s * normCdf(d1)
                          :  r * df * k * normCdf(-d2) - q * dq * s * normCdf(-d1)) ) / 365;
  const rho   = (call ? t * df * k * normCdf(d2) : -t * df * k * normCdf(-d2)) * 0.01; // per 1% rate

  return { price, delta, gamma, vega, theta, rho };
}
