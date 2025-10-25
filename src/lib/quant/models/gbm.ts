// GBM path generator (log-Euler), with antithetic pairs

import { RNG } from "../core/rng";

export type GBMParams = { s0: number; mu: number; sigma: number; dt: number; steps: number };

export function gbmPath(params: GBMParams, rng = new RNG()) {
  const { s0, mu, sigma, dt, steps } = params;
  const out = new Float64Array(steps + 1);
  out[0] = s0;
  let s = s0;
  for (let i = 1; i <= steps; i++) {
    const [z, zAnti] = rng.normalPair();
    const drift = (mu - 0.5 * sigma * sigma) * dt;
    const vol = sigma * Math.sqrt(dt);
    // use z for main path (you can return both for variance reduction)
    s = s * Math.exp(drift + vol * z);
    out[i] = s;
  }
  return out;
}
