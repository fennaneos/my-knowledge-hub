/* ---------------- Black–Scholes helpers ---------------- */

export function normPdf(x: number) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function normCdf(x: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp(-0.5 * x * x);
  const p =
    d *
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - p : p;
}

/** Black–Scholes model with continuous rates and dividend yield q */
export function bs(S: number, K: number, r: number, q: number, vol: number, T: number) {
  if (T <= 0 || vol <= 0 || S <= 0 || K <= 0) {
    return {
      call: 0, put: 0,
      deltaC: 0, deltaP: 0, gamma: 0, vega: 0,
      thetaC: 0, thetaP: 0, rhoC: 0, rhoP: 0,
      d1: NaN, d2: NaN
    };
  }
  const sv = vol * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * vol * vol) * T) / sv;
  const d2 = d1 - sv;

  const df = Math.exp(-r * T);
  const dq = Math.exp(-q * T);

  const Nd1 = normCdf(d1), Nd2 = normCdf(d2);
  const Nmd1 = normCdf(-d1), Nmd2 = normCdf(-d2);

  const call = S * dq * Nd1 - K * df * Nd2;
  const put  = K * df * Nmd2 - S * dq * Nmd1;

  const gamma = dq * normPdf(d1) / (S * sv);
  const vega  = S * dq * normPdf(d1) * Math.sqrt(T);
  const deltaC = dq * Nd1;
  const deltaP = dq * (Nd1 - 1);
  const thetaC = -(S * dq * normPdf(d1) * vol) / (2 * Math.sqrt(T)) - r * K * df * Nd2 + q * S * dq * Nd1;
  const thetaP = -(S * dq * normPdf(d1) * vol) / (2 * Math.sqrt(T)) + r * K * df * Nmd2 - q * S * dq * Nmd1;
  const rhoC   =  K * T * df * Nd2;
  const rhoP   = -K * T * df * Nmd2;

  return { call, put, deltaC, deltaP, gamma, vega, thetaC, thetaP, rhoC, rhoP, d1, d2 };
}
