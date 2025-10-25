import { GBMParams, gbmPath } from "../models/gbm";
import { RNG } from "../core/rng";
import { monteCarlo, MCOpts } from "../mc/engine";

export type BarrierIn = {
  s0: number; k: number; r: number; q?: number; vol: number; t: number;
  barrier: number; // e.g. down-and-out call
  call: boolean;
};
export function barrierOutMC(input: BarrierIn, mc: MCOpts) {
  const { s0, k, r, q = 0, vol, t, barrier, call } = input;
  const steps = mc.steps;
  const dt = t / steps;
  const disc = Math.exp(-r * t);

  return monteCarlo(mc, (rng: RNG) => {
    const path = gbmPath({ s0, mu: (r - q), sigma: vol, dt, steps }, rng);
    // knock-out if touched below barrier
    let knocked = false;
    for (let i = 1; i < path.length; i++) {
      if (path[i] <= barrier) { knocked = true; break; }
    }
    if (knocked) return 0;
    const sT = path[path.length - 1];
    const payoff = Math.max(call ? sT - k : k - sT, 0);
    return disc * payoff;
  });
}
