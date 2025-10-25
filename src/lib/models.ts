// src/lib/models.ts
// Minimal, dependency-free pricing engines for serverless use

export type Greeks = { delta:number; gamma:number; vega:number; theta:number; rho:number };

const SQRT2PI = Math.sqrt(2*Math.PI);
function N(x:number){ return 0.5 * (1 + erf(x/Math.SQRT2)); }
function n_(x:number){ return Math.exp(-0.5*x*x) / SQRT2PI; }
function erf(x:number){
  // Abramowitz–Stegun 7.1.26
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
  const s = Math.sign(x); const t = 1/(1+p*Math.abs(x));
  const y = 1-((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return s*y;
}

/** Black–Scholes (lognormal underlying) */
export function blackScholes(
  S:number, K:number, r:number, q:number, vol:number, T:number, call=true
){
  if (T<=0 || vol<=0) {
    const fwd = S*Math.exp((r-q)*T);
    const intrinsic = call ? Math.max(fwd-K,0) : Math.max(K-fwd,0);
    return { price: intrinsic*Math.exp(-r*T), greeks: null as unknown as Greeks };
  }
  const d1 = (Math.log(S/K) + (r - q + 0.5*vol*vol)*T) / (vol*Math.sqrt(T));
  const d2 = d1 - vol*Math.sqrt(T);
  const disc = Math.exp(-r*T), div = Math.exp(-q*T);
  const price = call
    ? S*div*N(d1) - K*disc*N(d2)
    : K*disc*N(-d2) - S*div*N(-d1);

  // simple greeks (undiscounted conventions)
  const delta = call ? div*N(d1) : -div*N(-d1);
  const gamma = div*n_(d1)/(S*vol*Math.sqrt(T));
  const vega  = S*div*n_(d1)*Math.sqrt(T);      // per vol(1.00)
  const theta = - (S*div*n_(d1)*vol)/(2*Math.sqrt(T))
                - (call ? - (r*K*disc)*N(d2) + q*S*div*N(d1)
                        :   (r*K*disc)*N(-d2) - q*S*div*N(-d1));
  const rho   = call ? K*T*disc*N(d2) : -K*T*disc*N(-d2);
  return { price, greeks: { delta, gamma, vega, theta, rho } };
}

/** Black-76 (for forwards/rates) used for Caps/Floors */
export function black76(F:number, K:number, r:number, vol:number, T:number, call=true){
  const d1 = (Math.log(F/K) + 0.5*vol*vol*T) / (vol*Math.sqrt(T));
  const d2 = d1 - vol*Math.sqrt(T);
  const disc = Math.exp(-r*T);
  const price = disc * (call ? (F*N(d1) - K*N(d2)) : (K*N(-d2) - F*N(-d1)));
  return { price };
}

/** Reiner–Rubinstein closed forms for barrier out options (rough, equity q-dividend) */
export function barrierOut(
  S:number,K:number, H:number, r:number, q:number, vol:number, T:number, call=true
){
  // Guard: if spot breached barrier, option is out
  if ((call && S>=H) || (!call && S<=H)) return { price: 0 };
  // denominators
  const mu = (r - q - 0.5*vol*vol)/(vol*vol);
  const lambda = Math.sqrt(mu*mu + 2*(r - q)/(vol*vol));
  const x1 = Math.log(S/K)/(vol*Math.sqrt(T)) + (1+mu)*vol*Math.sqrt(T);
  const y1 = Math.log(H*H/(S*K))/(vol*Math.sqrt(T)) + (1+mu)*vol*Math.sqrt(T);
  const z  = Math.log(H/S)/(vol*Math.sqrt(T)) + lambda*vol*Math.sqrt(T);
  const disc = Math.exp(-r*T), div = Math.exp(-q*T);

  if (call) {
    const A = S*div*N(x1) - K*disc*N(x1 - vol*Math.sqrt(T));
    const B = S*div*Math.pow(H/S,2*(mu+1))*N(y1) - K*disc*Math.pow(H/S,2*mu)*N(y1 - vol*Math.sqrt(T));
    const C = K*disc*(Math.pow(H/K, mu+lambda)*N(z) - Math.pow(H/K, mu-lambda)*N(z - 2*lambda*vol*Math.sqrt(T)));
    return { price: A - B - C };
  } else {
    const x2 = Math.log(S/K)/(vol*Math.sqrt(T)) + (1+mu)*vol*Math.sqrt(T);
    const y2 = Math.log(H*H/(S*K))/(vol*Math.sqrt(T)) + (1+mu)*vol*Math.sqrt(T);
    const A = K*disc*N(-x2 + vol*Math.sqrt(T)) - S*div*N(-x2);
    const B = K*disc*Math.pow(H/S,2*mu)*N(-y2 + vol*Math.sqrt(T)) - S*div*Math.pow(H/S,2*(mu+1))*N(-y2);
    const C = K*disc*(Math.pow(H/K, mu+lambda)*N(-z + 2*lambda*vol*Math.sqrt(T)) - Math.pow(H/K, mu-lambda)*N(-z));
    return { price: A - B - C };
  }
}

/** Plain-vanilla interest rate swap: par rate on fixed leg, PV with flat curve */
export function swapPV(notional:number, fixed:number, rFlat:number, tenorYears:number, payFreq=2){
  const n = Math.max(1, Math.round(tenorYears*payFreq));
  const dt = 1/payFreq;
  let annuity = 0, df = 0, pvFloat = 0;
  for (let i=1;i<=n;i++){
    const t = i*dt;
    const disc = Math.exp(-rFlat*t);
    annuity += disc*dt;
    df += disc;
    // Float leg PV (par at inception, here assume fwd = rFlat)
    pvFloat += notional * (Math.exp(rFlat*dt)-1) * Math.exp(-rFlat*(t-dt)); // simple comp alignment
  }
  const pvFixed = notional * fixed * annuity;
  const pv = pvFloat - pvFixed;
  const parRate = pvFloat / (notional * annuity);
  return { pv, parRate };
}

/** Cap/Floor as sum of Black-76 caplets/floorlets on flat vol (demo) */
export function capFloorPV(
  notional:number, strike:number, rFlat:number, vol:number, tenorYears:number, payFreq=4, isCap=true
){
  const n = Math.max(1, Math.round(tenorYears*payFreq));
  const dt = 1/payFreq;
  let pv = 0;
  for (let i=1;i<=n;i++){
    const tStart = (i-1)*dt, tEnd = i*dt;
    const F = rFlat; // flat forward proxy
    const { price } = black76(F, strike, rFlat, vol, tEnd, isCap);
    pv += notional * dt * price; // accrual
  }
  return { pv };
}
