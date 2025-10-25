// lightweight numerics: normal, erf, root finding

export const SQRT1_2 = Math.SQRT1_2;

export function erf(x: number) {
  // Abramowitz-Stegun 7.1.26
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

export function normCdf(x: number) {
  return 0.5 * (1 + erf(x * SQRT1_2));
}
export function normPdf(x: number) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function brent(
  f: (x: number) => number,
  a: number,
  b: number,
  tol = 1e-8,
  maxIt = 100
) {
  // assumes f(a)*f(b) < 0
  let fa = f(a), fb = f(b);
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa * fb > 0) throw new Error("brent: root not bracketed");
  let c = a, fc = fa, d = b - a, e = d;
  for (let it = 0; it < maxIt; it++) {
    if (Math.abs(fc) < Math.abs(fb)) { [a, b, c] = [b, c, a]; [fa, fb, fc] = [fb, fc, fa]; }
    const tol1 = 2 * Number.EPSILON * Math.abs(b) + 0.5 * tol;
    const xm = 0.5 * (c - b);
    if (Math.abs(xm) <= tol1 || fb === 0) return b;
    if (Math.abs(e) >= tol1 && Math.abs(fa) > Math.abs(fb)) {
      let s = fb / fa, p, q;
      if (a === c) { p = 2 * xm * s; q = 1 - s; }
      else {
        q = fa / fc; const r = fb / fc;
        p = s * (2 * xm * q * (q - r) - (b - a) * (r - 1));
        q = (q - 1) * (r - 1) * (s - 1);
      }
      if (p > 0) q = -q;
      p = Math.abs(p);
      const min1 = 3 * xm * q - Math.abs(tol1 * q);
      const min2 = Math.abs(e * q);
      if (2 * p < (min1 < min2 ? min1 : min2)) { e = d; d = p / q; }
      else { d = xm; e = d; }
    } else { d = xm; e = d; }
    a = b; fa = fb;
    b += Math.abs(d) > tol1 ? d : (xm >= 0 ? tol1 : -tol1);
    fb = f(b);
    if ((fb > 0 && fc > 0) || (fb < 0 && fc < 0)) { c = a; fc = fa; e = d = b - a; }
  }
  return b;
}
