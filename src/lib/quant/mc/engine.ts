import { RNG } from "../core/rng";

// generic MC skeleton: you provide a step() and payoff() for each product
export type MCOpts = {
  paths: number;
  steps: number;
  antithetic?: boolean;
  seed?: number;
};

export function monteCarlo(
  opts: MCOpts,
  simulate: (rng: RNG, pathIndex: number) => number // returns discounted payoff of a path
) {
  const { paths, seed = 123456, antithetic = true } = opts;
  const rng = new RNG(seed);

  let sum = 0, sum2 = 0;
  for (let i = 0; i < paths; i++) {
    const pay = simulate(rng, i);
    sum += pay; sum2 += pay * pay;
  }
  const mean = sum / paths;
  const var_ = Math.max(0, sum2 / paths - mean * mean);
  const se = Math.sqrt(var_ / paths);
  return { price: mean, se };
}
