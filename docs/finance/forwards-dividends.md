---
id: forwards-dividends
title: Forward Pricing with Dividends — Simple AOA Proof
sidebar_label: Forward (with Dividends)
---

# 📈 Forward Pricing with Dividends — Simple Arbitrage Proof


Assumptions: deterministic risk-free rate $$r$$; dividends in $$(t,T]$$ are **known** (either discrete cash amounts or a continuous yield).

---

## 1) Discrete Cash Dividends

Let the asset pay known cash dividends $$D_i$$ at dates $$t < t_i \le T$$.  
Define the present value at time $$t$$:

$$
\text{PV}_t[\text{divs}] = \sum_{i: t_i \le T} D_i \, e^{-r\,(t_i - t)}.
$$

### Portfolio 1
- Long **one forward** at time $$t$$.  
- Cost today:
$$
P_1(t) = 0
$$
- Payoff at $$T$$:
$$
P_1(T) = S_T - F_t(T).
$$

### Portfolio 2
At time $$t$$:
1) **Buy one share** (pay $$S_t$$).  
2) **Borrow** an amount equal to $$F_t(T)\,e^{-r\,(T-t)}$$ (so you owe $$F_t(T)$$ at $$T$$).  
3) **Sell forward** the dividend stream (i.e., short a strip of risk-free deposits that will pay each $$D_i$$ on $$t_i$$).  
   This **adds** today exactly $$\text{PV}_t[\text{divs}]$$ in cash (because you are short the deposits).

:::info
## 📉 Forward on Dividend-Paying Assets: Shorting the Dividend Stream

When the underlying pays **known discrete dividends** $$D_1, D_2, \dots, D_m$$ at times $$t_1, t_2, \dots, t_m \leq T$$, we can think of the dividend stream as a portfolio of **zero-coupon bonds**:

$$
\text{Dividend stream} \equiv \{ D_i \text{ paid at } t_i \}_{i=1}^m.
$$

Each dividend $$D_i$$ has a present value at time $$t$$:

$$
\text{PV}_t(D_i) = D_i \, e^{-r\,(t_i - t)}.
$$

Thus, the **total present value of dividends** is:

$$
\text{PV}_t[\text{divs}] = \sum_{i=1}^m D_i \, e^{-r\,(t_i - t)}.
$$

---

### 🔄 Shorting the Dividend Stream

- To **short the dividend stream** means to short a strip of risk-free deposits (or zero-coupon bonds) that will pay each $$D_i$$ at $$t_i$$.
- By doing so, you **receive today** exactly:

$$
\text{PV}_t[\text{divs}].
$$

- Later, you will owe each $$D_i$$ at its payment date $$t_i$$.

---

### ✅ Intuition

Holding the stock gives you both:
- Final price $$S_T$$  
- Dividends $$\{D_i\}$$

If you buy the stock **and short the dividend stream**, the dividend cash flows cancel out.  
You are left with exposure to the **pure terminal stock price** at $$T$$.

This is the so-called **prepaid forward** construction, which is key to deriving the forward price under dividends.

---

:::note 💡 Side Note
Think of shorting the dividend stream as "selling future coupons."  
You get their present value now in cash, but in exchange you promise to hand them over at their due dates.  
Since the stock naturally delivers dividends, shorting the dividend strip neutralizes them and isolates the terminal stock payoff.
:::


- Cost today:
$$
P_2(t) = S_t - F_t(T)\,e^{-r\,(T-t)} - \text{PV}_t[\text{divs}].
$$
- Payoff at $$T$$:  
  You receive the share’s terminal price $$S_T$$, you **pay away** the dividends $$D_i$$ as they occur (because you shorted the deposits), and you repay the loan $$F_t(T)$$. Net:
$$
P_2(T) = S_T - F_t(T).
$$

**Same payoff at $$T$$**, therefore by absence of arbitrage:
$$
P_1(t) = P_2(t).
$$

Hence:
$$
0 = S_t - F_t(T)\,e^{-r\,(T-t)} - \text{PV}_t[\text{divs}].
$$

Solve for $$F_t(T)$$:
$$
\boxed{\,F_t(T) = \big(S_t - \text{PV}_t[\text{divs}]\big)\,e^{r\,(T-t)}\,}
$$

---

## 2) Continuous Dividend Yield $$q$$

When the asset pays a **continuous proportional yield** $$q$$ over $$(t,T]$$, the present value of income equals the **loss of carry** from holding the asset.  
A convenient way is to think in terms of a **prepaid forward**:

- Prepaid forward price at time $$t$$:
$$
F_t^{\text{prepaid}}(T) = S_t \, e^{-q\,(T-t)}.
$$
- Convert prepaid to standard forward by compounding at $$r$$:
$$
\boxed{\,F_t(T) = S_t \, e^{(r - q)\,(T-t)}\,}
$$

You can also obtain the same result by repeating the two-portfolio argument and **shorting the continuous dividend stream** instead of discrete deposits.

---

## 3) Quick Checks

1) **No dividends**  
   Set $$\text{PV}_t[\text{divs}] = 0$$ or $$q=0$$:
$$
F_t(T) = S_t \, e^{r\,(T-t)}.
$$

2) **One cash dividend $$D$$ at $$t_D \in (t,T]$$**:
$$
F_t(T) = \big(S_t - D\,e^{-r\,(t_D - t)}\big)\,e^{r\,(T-t)}.
$$

3) **If $$T < t_D$$** (dividend occurs after delivery):  
   No adjustment before $$T$$:
$$
F_t(T) = S_t \, e^{r\,(T-t)}.
$$

---

## ✅ Key Takeaway

**Forward = (Spot − PV of dividends up to delivery) grown at the risk-free rate.**  
For a continuous yield $$q$$, this collapses to the compact formula:
$$
F_t(T) = S_t \, e^{(r - q)\,(T-t)}.
$$



import TryIt from '@site/src/components/tryit/TryIt';

## 4) Practice — Try it Yourself

- **PV of discrete dividends** — implement `pv_dividends(divs, r, t)` to sum `D_i * e^{-r(t_i - t)}` for all `t_i ≤ T`.
- **Prepaid forward (discrete)** — `prepaid_forward_discrete(S, divs, r, t, T)` returns `S − PV_t[divs up to T]`.
- **Forward from discrete** — `forward_from_discrete(S, divs, r, t, T)` = `(S − PV_t[divs ≤ T]) * e^{r(T−t)}`.
- **Forward with yield q** — `forward_from_yield(S, r, q, t, T)` = `S * e^{(r−q)(T−t)}`.
- **No-dividend forward** — `forward_no_div(S, r, t, T)` = `S * e^{r(T−t)}`.
- **Single cash dividend** — `forward_single_div(S, D, tD, r, t, T)` adjusts only if `t < tD ≤ T`.
- **Implied PV(divs)** — `implied_pv_divs(S, F, r, t, T)` = `S − F * e^{−r(T−t)}`.
- **Implied dividend yield** — `implied_yield(S, F, r, t, T)` = `r − ln(F/S)/(T−t)`.
- **Forward growth factor** — `forward_factor(r, q, t, T)` = `e^{(r−q)(T−t)}`.
- **Match yield vs discrete** — `match_yield_vs_discrete(S, r, q, divs, t, T)` returns `(Fy, Fd)` using both methods.

<TryIt
  id="fwd-divs-lab"
  chapterId="forwards-dividends"
  title="Forward Pricing (with Dividends) — Mini Lab"
  intro="Implement the functions listed above, then click Run tests. Each exercise has 2 tests worth 0.3★ (total 3★)."
  hideTiles
  starTotal={3}
  packWeight={0.3}
  packs={[
    {
      id: 'pv_divs',
      name: '⭐ Present Value of Discrete Dividends',
      desc: 'Sum D_i * exp(-r*(t_i - t)) for dividend dates up to T.',
      detect: "def\\s+pv_dividends\\s*\\(",
      scaffold: `import math

def pv_dividends(divs, r, t):
    \"\"\"Return PV_t[divs] for a list of (D_i, t_i), using continuous compounding.
    PV = sum(D_i * exp(-r*(t_i - t))) for all t_i >= t.
    \"\"\"
    # TODO
    return 0.0
`,
      hint: `Use: pv += D * math.exp(-r*(ti - t))`,
      tests: [
        { expr: ['import math','divs=[(3.0,0.5),(2.0,1.0)] ; r=0.05 ; t=0.0','pv_dividends(divs,r,t)'].join('; '),
          expected: Number(((3*Math.exp(-0.05*0.5)) + (2*Math.exp(-0.05*1.0))).toFixed(9)), tol: 1e-6 },
        { expr: ['import math','divs=[(1.5,0.25),(1.2,0.75),(0.8,1.25)] ; r=0.04 ; t=0.0','pv_dividends(divs,r,t)'].join('; '),
          expected: Number(((1.5*Math.exp(-0.04*0.25)) + (1.2*Math.exp(-0.04*0.75)) + (0.8*Math.exp(-0.04*1.25))).toFixed(9)), tol: 1e-6 },
      ],
    },
    {
      id: 'prepaid_discrete',
      name: '⭐ Prepaid Forward (discrete dividends)',
      desc: 'Compute F_pre = S − PV_t[divs up to T].',
      detect: "def\\s+prepaid_forward_discrete\\s*\\(",
      scaffold: `import math

def prepaid_forward_discrete(S, divs, r, t, T):
    \"\"\"Return prepaid forward price with discrete dividends up to T:
    F_pre = S - PV_t[divs up to T].
    \"\"\"
    # TODO (use your pv_dividends helper)
    return 0.0
`,
      hint: `F_pre = S - PV(divs with t_i ≤ T)`,
      tests: [
        { expr: ['import math','S=100; r=0.05; t=0.0; T=1.0','divs=[(3.0,0.5),(2.0,1.2)]','prepaid_forward_discrete(S,divs,r,t,T)'].join('; '),
          expected: Number((100 - (3*Math.exp(-0.05*0.5))).toFixed(9)), tol: 1e-6 },
        { expr: ['import math','S=250; r=0.03; t=0.0; T=2.0','divs=[(2.0,0.5),(2.0,1.5),(2.0,2.5)]','prepaid_forward_discrete(S,divs,r,t,T)'].join('; '),
          expected: Number((250 - (2*Math.exp(-0.03*0.5) + 2*Math.exp(-0.03*1.5))).toFixed(9)), tol: 1e-6 },
      ],
    },
    {
      id: 'forward_discrete',
      name: '⭐ Forward from Discrete Dividends',
      desc: 'F = (S − PV_t[divs ≤ T]) * e^{r(T−t)}.',
      detect: "def\\s+forward_from_discrete\\s*\\(",
      scaffold: `import math

def forward_from_discrete(S, divs, r, t, T):
    \"\"\"Return F_t(T) = (S - PV_t[divs up to T]) * e^{r(T - t)}\"\"\"
    # TODO
    return 0.0
`,
      hint: `Compute prepaid then grow by exp(r*(T-t))`,
      tests: [
        { expr: ['import math','S=100; r=0.05; t=0.0; T=1.0; divs=[(3.0,0.5)]','forward_from_discrete(S,divs,r,t,T)'].join('; '),
          expected: Number(((100 - 3*Math.exp(-0.05*0.5))*Math.exp(0.05)).toFixed(9)), tol: 1e-6 },
        { expr: ['import math','S=180; r=0.02; t=0.0; T=1.5; divs=[(1.5,0.25),(1.5,1.25)]','forward_from_discrete(S,divs,r,t,T)'].join('; '),
          expected: Number(((180 - (1.5*Math.exp(-0.02*0.25)+1.5*Math.exp(-0.02*1.25)))*Math.exp(0.02*1.5)).toFixed(9)), tol: 1e-6 },
      ],
    },
    {
      id: 'forward_yield',
      name: '⭐ Forward with Continuous Yield q',
      desc: 'F = S * e^{(r−q)(T−t)}.',
      detect: "def\\s+forward_from_yield\\s*\\(",
      scaffold: `import math

def forward_from_yield(S, r, q, t, T):
    \"\"\"Return F_t(T) = S * exp((r - q)*(T - t)).\"\"\"
    # TODO
    return 0.0
`,
      hint: `Just S*exp((r-q)*(T-t))`,
      tests: [
        { expr: ['import math','S=100; r=0.02; q=0.03; t=0; T=1','forward_from_yield(S,r,q,t,T)'].join('; '),
          expected: Number((100*Math.exp((0.02-0.03)*1)).toFixed(9)), tol: 1e-6 },
        { expr: ['import math','S=250; r=0.01; q=0.00; t=0; T=2','forward_from_yield(S,r,q,t,T)'].join('; '),
          expected: Number((250*Math.exp((0.01-0.0)*2)).toFixed(9)), tol: 1e-6 },
      ],
    },
    {
      id: 'no_div_forward',
      name: '⭐ No-Dividend Forward (sanity)',
      desc: 'F = S * e^{r(T−t)}.',
      detect: "def\\s+forward_no_div\\s*\\(",
      scaffold: `import math

def forward_no_div(S, r, t, T):
    \"\"\"Return F_t(T) = S * exp(r*(T - t)) (no dividends).\"\"\"
    # TODO
    return 0.0
`,
      hint: `Growth at risk-free`,
      tests: [
        { expr: ['import math','S=100;r=0.05;t=0;T=1','forward_no_div(S,r,t,T)'].join('; '),
          expected: Number((100*Math.exp(0.05)).toFixed(9)), tol: 1e-6 },
        { expr: ['import math','S=150;r=0.03;t=0;T=2','forward_no_div(S,r,t,T)'].join('; '),
          expected: Number((150*Math.exp(0.03*2)).toFixed(9)), tol: 1e-6 },
      ],
    },
    {
      id: 'single_div',
      name: '⭐ Single Cash Dividend Adjustment',
      desc: 'Adjust only if dividend date falls in (t, T].',
      detect: "def\\s+forward_single_div\\s*\\(",
      scaffold: `import math

def forward_single_div(S, D, tD, r, t, T):
    \"\"\"If t < tD ≤ T:
    F = (S - D*exp(-r*(tD - t))) * exp(r*(T - t)).
    If tD > T: F = S*exp(r*(T - t)).
    \"\"\"
    # TODO
    return 0.0
`,
      hint: `Branch on tD <= T`,
      tests: [
        { expr: ['import math','S=100;D=3;tD=0.5;r=0.05;t=0;T=1.0','forward_single_div(S,D,tD,r,t,T)'].join('; '),
          expected: Number(((100 - 3*Math.exp(-0.05*0.5))*Math.exp(0.05)).toFixed(9)), tol: 1e-6 },
        { expr: ['import math','S=100;D=3;tD=1.5;r=0.05;t=0;T=1.0','forward_single_div(S,D,tD,r,t,T)'].join('; '),
          expected: Number((100*Math.exp(0.05)).toFixed(9)), tol: 1e-6 },
      ],
    },
    {
      id: 'implied_pv_divs',
      name: '⭐ Implied PV(dividends) from F',
      desc: 'Invert discrete-div formula: PV = S − F e^{−r(T−t)}.',
      detect: "def\\s+implied_pv_divs\\s*\\(",
      scaffold: `import math

def implied_pv_divs(S, F, r, t, T):
    \"\"\"From F = (S - PV_divs)*e^{r(T-t)} ⇒ PV_divs = S - F*e^{-r(T-t)}\"\"\"
    # TODO
    return 0.0
`,
      hint: `Rearrange the discrete-div formula`,
      tests: [
        { expr: ['import math','S=100; r=0.05; t=0; T=1; F=97.0','implied_pv_divs(S,F,r,t,T)'].join('; '),
          expected: Number((100 - 97*Math.exp(-0.05)).toFixed(9)), tol: 1e-6 },
        { expr: ['import math','S=180; r=0.02; t=0; T=1.5; F=176.0','implied_pv_divs(S,F,r,t,T)'].join('; '),
          expected: Number((180 - 176*Math.exp(-0.02*1.5)).toFixed(9)), tol: 1e-6 },
      ],
    },
    {
      id: 'implied_yield',
      name: '⭐ Implied Dividend Yield',
      desc: 'q = r − ln(F/S)/(T−t).',
      detect: "def\\s+implied_yield\\s*\\(",
      scaffold: `import math

def implied_yield(S, F, r, t, T):
    \"\"\"From F = S*exp((r - q)*(T-t)) ⇒
    q = r - (1/(T-t)) * ln(F/S)
    \"\"\"
    # TODO (assume T>t, S>0, F>0)
    return 0.0
`,
      hint: `Use math.log(F/S)`,
      tests: [
        { expr: ['import math','S=100; r=0.05; t=0; T=1; F=99.0','implied_yield(S,F,r,t,T)'].join('; '),
          expected: Number((0.05 - Math.log(99/100)/(1)).toFixed(9)), tol: 1e-9 },
        { expr: ['import math','S=250; r=0.03; t=0; T=2; F=245.0','implied_yield(S,F,r,t,T)'].join('; '),
          expected: Number((0.03 - Math.log(245/250)/2).toFixed(9)), tol: 1e-9 },
      ],
    },
    {
      id: 'fwd_factor',
      name: '⭐ Forward Growth Factor',
      desc: 'Compute e^{(r−q)(T−t)}.',
      detect: "def\\s+forward_factor\\s*\\(",
      scaffold: `import math

def forward_factor(r, q, t, T):
    \"\"\"Return exp((r - q)*(T - t))\"\"\"
    # TODO
    return 0.0
`,
      hint: `One-liner with exp`,
      tests: [
        { expr: ['import math','r=0.02;q=0.03;t=0;T=1','forward_factor(r,q,t,T)'].join('; '),
          expected: Number((Math.exp((0.02-0.03)*1)).toFixed(12)), tol: 1e-9 },
        { expr: ['import math','r=0.01;q=0.00;t=0;T=2','forward_factor(r,q,t,T)'].join('; '),
          expected: Number((Math.exp((0.01-0.0)*2)).toFixed(12)), tol: 1e-9 },
      ],
    },
    {
      id: 'match_yield_vs_discrete',
      name: '⭐ Match Yield vs Discrete',
      desc: 'Return (Fy, Fd) from both methods to compare.',
      detect: "def\\s+match_yield_vs_discrete\\s*\\(",
      scaffold: `import math

def match_yield_vs_discrete(S, r, q, divs, t, T):
    \"\"\"Return tuple (Fy, Fd) where
    Fy = S*exp((r-q)*(T-t))
    Fd = (S - PV_t[divs up to T]) * exp(r*(T-t))
    \"\"\"
    # TODO
    return (0.0, 0.0)
`,
      hint: `Re-use helpers you wrote`,
      tests: [
        { expr: ['import math','S=100;r=0.05;q=0.0;t=0;T=1.0; divs=[]','tuple(map(lambda x: round(x,9), match_yield_vs_discrete(S,r,q,divs,t,T)))'].join('; '),
          expected: [Number((100*Math.exp(0.05)).toFixed(9)), Number((100*Math.exp(0.05)).toFixed(9))], tol: 1e-6 },
        { expr: ['import math','S=100;r=0.03;q=0.02;t=0;T=1.0; divs=[(2.0,0.5)]','tuple(map(lambda x: round(x,6), match_yield_vs_discrete(S,r,q,divs,t,T)))'].join('; '),
          expected: [Number((100*Math.exp((0.03-0.02)*1)).toFixed(6)), Number(((100 - 2*Math.exp(-0.03*0.5))*Math.exp(0.03)).toFixed(6))], tol: 1e-4 },
      ],
    },
  ]}
/>
