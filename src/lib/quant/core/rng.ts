// simple XORShift + antithetic; seedable and fast

export class RNG {
  private state: number;
  constructor(seed = 123456789) {
    this.state = seed >>> 0 || 1;
  }
  u32() {
    let x = this.state;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }
  uniform() {
    return (this.u32() + 1) / 4294967297; // (0,1)
  }
  // Box–Muller (polar) with antithetic option
  normalPair() {
    let u = 0, v = 0, s = 0;
    do {
      u = 2 * this.uniform() - 1;
      v = 2 * this.uniform() - 1;
      s = u * u + v * v;
    } while (s === 0 || s >= 1);
    const mul = Math.sqrt(-2 * Math.log(s) / s);
    return [u * mul, -u * mul] as const; // antithetic pair
  }
}
