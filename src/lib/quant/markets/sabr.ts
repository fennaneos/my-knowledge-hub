import { brent } from "../core/math";

export type SabrParams = { alpha: number; beta: number; rho: number; nu: number }; // Hagan
export type SabrPoint = { k: number; t: number; iv: number };

function haganIV(f: number, k: number, t: number, p: SabrParams) {
  // Hagan et al. implied vol approximation (lognormal)
  const { alpha, beta, rho, nu } = p;
  const oneMinusB = 1 - beta;
  const fk = f * k;
  const z = (nu / alpha) * Math.pow(fk, oneMinusB / 2) * Math.log(f / k);
  const xz = Math.log((Math.sqrt(1 - 2 * rho * z + z * z) + z - rho) / (1 - rho));
  const A = alpha / (Math.pow(fk, oneMinusB / 2) * (1 + (oneMinusB * oneMinusB / 24) * Math.pow(Math.log(f / k), 2) + (oneMinusB ** 4 / 1920) * Math.pow(Math.log(f / k), 4)));
  const B = 1 + ((oneMinusB ** 2 / 24) * (alpha * alpha) / (Math.pow(fk, oneMinusB))
              + (rho * beta * nu * alpha) / (4 * Math.pow(fk, oneMinusB / 2))
              + ((2 - 3 * rho * rho) * (nu * nu) / 24)) * t;
  return (A * (z === 0 ? 1 : z / xz)) * B;
}

// simple beta fixed, rho/nu/alpha calibrated by least squares
export function calibrateSabr(
  f: number,
  points: SabrPoint[],
  beta = 0.5,
  guess: SabrParams = { alpha: 0.2, beta, rho: 0.0, nu: 0.5 }
): SabrParams {
  // keep it simple for now: only alpha, rho, nu, fix beta
  let { alpha, rho, nu } = guess;

  const err = (alpha_: number, rho_: number, nu_: number) =>
    points.reduce((acc, p) => {
      const iv = haganIV(f, p.k, p.t, { alpha: alpha_, beta, rho: rho_, nu: nu_ });
      const d = iv - p.iv;
      return acc + d * d;
    }, 0);

  // crude coordinate search (replace with LM later)
  for (let it = 0; it < 25; it++) {
    // alpha positive
    const fA = (a: number) => err(Math.max(1e-6, a), rho, nu);
    alpha = brent((x) => fA(x), Math.max(1e-4, alpha / 2), alpha * 2);
    // rho in (-0.999, 0.999)
    const fR = (r: number) => err(Math.max(-0.999, Math.min(0.999, r)), rho, nu);
    rho = Math.max(-0.999, Math.min(0.999, brent((x) => fR(x), rho - 0.5, rho + 0.5)));
    // nu positive
    const fN = (n: number) => err(alpha, rho, Math.max(1e-4, n));
    nu = brent((x) => fN(x), Math.max(1e-4, nu / 2), nu * 2);
  }
  return { alpha, beta, rho, nu };
}

export function sabrIV(f: number, k: number, t: number, p: SabrParams) {
  return haganIV(f, k, t, p);
}
