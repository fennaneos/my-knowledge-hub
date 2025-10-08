---
id: autocallables
title: Autocallables Explained
sidebar_label: Autocallables
---

# 🏦 Autocallable Products

Autocallables (or "Autocalls") are **structured products** widely used in equity-linked investments.  
They combine a **bond component** and a **derivatives component**, with the potential for **early redemption** if certain conditions are met.

---

## 🔑 Key Components

### 1️⃣ Bond Component

A portfolio of zero-coupon bonds that guarantees nominal repayment at maturity  
(assuming the issuer remains solvent):

$$
V_{\text{bond}} = N \cdot P(0,T)
$$

where $P(0,T)$ is the discount factor to maturity.

### 2️⃣ Derivatives Component

A basket of options that generates coupons and controls early redemption:

- **Call options** (digitals) that trigger early autocall when $S_T \geq K_{\text{auto}}$
- **Puts** (often down-and-in) that absorb losses if $S_T < K_{\text{KI}}$

Total payoff:

$$
V_{\text{autocall}} = V_{\text{bond}} + V_{\text{options}}
$$

---

## 🧠 Pricing via No-Arbitrage

### 1️⃣ Replication Principle

Construct two portfolios:

- **Portfolio A:** Buy bond + buy options replicating coupon/redemption profile  
- **Portfolio B:** Hold forward contract on underlying (adjusted for dividends)

By **absence of arbitrage (AOA)**:

$$
V_{\text{A}}(0) = V_{\text{B}}(0)
$$

We solve for the fair coupon or product price.

---

### 2️⃣ Impact of Interest Rates

Interest rates affect both legs:

#### Bond Leg

$$
V_{\text{bond}} = N \cdot e^{-rT} \quad
\Rightarrow \quad r \uparrow \Rightarrow V_{\text{bond}} \downarrow
$$

#### Option Leg

Options are priced on **forward prices**:

$$
F_0 = S_0 e^{(r - q)T}
$$

Thus:

- $r \uparrow \Rightarrow F_0 \uparrow$ (higher forward → higher early redemption probability)
- Digital calls (autocall triggers) **gain value**
- Down-and-in puts (risk leg) **lose value** (good for investor)

Net effect: **ambiguous** but usually **positive** for typical autocall structures.

---

## 📊 Timeline Illustration

| Time | Event                          | Payoff Component |
|------|-------------------------------|-----------------|
| $t_0$ | Product inception              | $-V_{\text{autocall}}$ |
| $t_1, t_2, \dots$ | Observation dates | Coupon paid if $S_{t_i} \geq K_{\text{auto}}$ |
| $T$  | Maturity                       | Nominal repaid if $S_T \geq K_{\text{KI}}$ else loss proportional to $S_T$ |

---

## 🛠 Practical Considerations

- **Dividends:** Adjust forward price for continuous or discrete dividends  
- **Volatility & Skew:** Coupon level very sensitive to skew (put wing pricing)  
- **Correlation (Basket Autocalls):** Affects joint probability of knock-in/knock-out events  
- **Rates:** Affect discounting + forward level → must use OIS discount curve

---

## ✅ Key Takeaways

- Autocallables are **bond + options hybrids**  
- Rates affect **both** discounting and forward → **double effect**  
- Skew modeling crucial: determines fair coupon  
- In stressed markets: skew steepens → coupons fall (riskier payoff)

---

## 📚 References

- Derman, Kani (1994): *The Smile* — foundation for local vol / skew modeling  
- Haug (2006): *Option Pricing Formulas* — closed-form results for barrier options  
- Carr & Madan (2001): *Option Valuation Using the Fast Fourier Transform*


import TryIt from '@site/src/components/tryit/TryIt';

## 9. Practical Lab — Autocallables (10 mini exercises)

<TryIt
  id="autocallables-lab"
  chapterId="autocallables"
  title="Autocallables — Mini Lab"
  intro="Complete each function, then click Run tests. Each exercise has 2 tests and is worth ¾★ when it passes (≈0.3★ per exercise)."
  starTotal={3}
  packWeight={0.3}
  packs={[
    {
      id: 'df',
      name: '① Discount factor',
      question: 'Implement discount_factor(r, T) = exp(-r·T). Used for the bond leg PV.',
      detect: "def\\s+discount_factor\\s*\\(",
      scaffold: `import math

def discount_factor(r, T):
    """Return e^(-r*T)."""
    # TODO
    return 0.0
`,
      hint: `💡 DF = exp(-r*T). Example: r=3%, T=2y → DF≈0.9417645`,
      weight: 0.3,
      tests: [
        { expr: 'import math; discount_factor(0.03, 2.0)', expected: 0.9417645335842487, tol: 1e-3 },
        { expr: 'import math; discount_factor(0.015, 1.5)', expected: 0.9777512371933363, tol: 1e-3 },
      ],
    },

    {
      id: 'fwd',
      name: '② Forward with dividends',
      question: 'Implement forward_price(S, r, q, T) = S·exp((r−q)·T). Drives autocall trigger probabilities.',
      detect: "def\\s+forward_price\\s*\\(",
      scaffold: `import math

def forward_price(S, r, q, T):
    """Return S * exp((r - q) * T)."""
    # TODO
    return 0.0
`,
      hint: `💡 Forward = S * exp((r - q) * T). Dividends lower the forward (q↑ ⇒ F↓).`,
      weight: 0.3,
      tests: [
        { expr: 'import math; forward_price(100, 0.02, 0.03, 1.0)', expected: 99.0049833749168, tol: 1e-3 },
        { expr: 'import math; forward_price(3500, 0.015, 0.025, 0.5)', expected: 3482.543677174424, tol: 1e-3 },
      ],
    },

    {
      id: 'norm',
      name: '③ Normal CDF',
      question: 'Implement norm_cdf(x) = N(x) using erf. Needed for BS probabilities.',
      detect: "def\\s+norm_cdf\\s*\\(",
      scaffold: `import math

def norm_cdf(x):
    """Return standard normal CDF N(x) via erf."""
    # N(x) = 0.5 * (1 + erf(x/sqrt(2)))
    # TODO
    return 0.0
`,
      hint: `💡 N(x) = 0.5 * (1 + erf(x / sqrt(2))).`,
      weight: 0.3,
      tests: [
        { expr: 'import math; norm_cdf(0.0)', expected: 0.5, tol: 1e-6 },
        { expr: 'import math; norm_cdf(1.0)', expected: 0.8413447460685429, tol: 1e-6 },
      ],
    },

    {
      id: 'd1',
      name: '④ Black–Scholes d₁',
      question: 'Implement bs_d1(S,K,r,q,σ,T) = [ln(S/K)+(r−q+½σ²)T]/(σ√T).',
      detect: "def\\s+bs_d1\\s*\\(",
      scaffold: `import math

def bs_d1(S, K, r, q, sigma, T):
    """Return d1 for Black–Scholes with dividend yield q."""
    # TODO: use math.log, math.sqrt
    return 0.0
`,
      hint: `💡 d1 = [ln(S/K) + (r - q + 0.5 σ²)T] / (σ√T).`,
      weight: 0.3,
      tests: [
        { expr: 'import math; bs_d1(100, 95, 0.02, 0.01, 0.25, 1.0)', expected: 0.5230986621603386, tol: 1e-6 },
        { expr: 'import math; bs_d1(120,100,0.03,0.01,0.20,0.5)', expected: 0.8661616151377551, tol: 1e-6 },
      ],
    },

    {
      id: 'd2',
      name: '⑤ Black–Scholes d₂',
      question: 'Implement bs_d2(...) = d1 − σ√T. Reuse your bs_d1.',
      detect: "def\\s+bs_d2\\s*\\(",
      scaffold: `import math

def bs_d2(S, K, r, q, sigma, T):
    """Return d2 = d1 - sigma*sqrt(T)."""
    # TODO: call your bs_d1
    return 0.0
`,
      hint: `💡 d2 = d1 − σ√T.`,
      weight: 0.3,
      tests: [
        { expr: 'import math; bs_d2(100, 95, 0.02, 0.01, 0.25, 1.0)', expected: 0.2730986621603386, tol: 1e-6 },
        { expr: 'import math; bs_d2(120,100,0.03,0.01,0.20,0.5)', expected: 0.724226804123711, tol: 1e-6 },
      ],
    },

    {
      id: 'digital',
      name: '⑥ Cash-or-nothing call (price)',
      question: 'Implement digital_call_cash(S,K,r,q,σ,T) = e^{−rT}·N(d₂). Approximates an autocall trigger payoff of 1.',
      detect: "def\\s+digital_call_cash\\s*\\(",
      scaffold: `import math

def bs_d1(S, K, r, q, sigma, T):
    return (math.log(S/K) + (r - q + 0.5*sigma*sigma)*T) / (sigma*math.sqrt(T))

def bs_d2(S, K, r, q, sigma, T):
    return bs_d1(S,K,r,q,sigma,T) - sigma*math.sqrt(T)

def norm_cdf(x):
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

def digital_call_cash(S, K, r, q, sigma, T):
    """Cash-or-nothing call: PV = e^{-rT} * N(d2)."""
    # TODO
    return 0.0
`,
      hint: `💡 Price = exp(-rT) * N(d2).`,
      weight: 0.3,
      tests: [
        { expr: 'import math; digital_call_cash(100, 95, 0.02, 0.01, 0.25, 1.0)', expected: 0.2688198490899248, tol: 1e-6 },
        { expr: 'import math; digital_call_cash(120,100,0.03,0.01,0.20,0.5)', expected: 0.6649210405304183, tol: 1e-6 },
      ],
    },

    {
      id: 'prob',
      name: '⑦ Early call probability (Q-measure)',
      question: 'Implement early_call_prob(S,K,r,q,σ,T) = N(d₂). This is the risk-neutral hit probability at an observation date.',
      detect: "def\\s+early_call_prob\\s*\\(",
      scaffold: `import math

def bs_d1(S, K, r, q, sigma, T):
    return (math.log(S/K) + (r - q + 0.5*sigma*sigma)*T) / (sigma*math.sqrt(T))

def bs_d2(S, K, r, q, sigma, T):
    return bs_d1(S,K,r,q,sigma,T) - sigma*math.sqrt(T)

def norm_cdf(x):
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

def early_call_prob(S, K, r, q, sigma, T):
    """Return N(d2)."""
    # TODO
    return 0.0
`,
      hint: `💡 N(d2) is the Q-probability that S_T ≥ K for BS with carry r−q.`,
      weight: 0.3,
      tests: [
        { expr: 'import math; early_call_prob(100, 95, 0.02, 0.01, 0.25, 1.0)', expected: 0.6073624255079531, tol: 1e-6 },
        { expr: 'import math; early_call_prob(120,100,0.03,0.01,0.20,0.5)', expected: 0.724226804123711, tol: 1e-6 },
      ],
    },

    {
      id: 'asset-dig',
      name: '⑧ Asset-or-nothing call (price)',
      question: 'Implement asset_digital_call(S,K,r,q,σ,T) = S·e^{−qT}·N(d₁).',
      detect: "def\\s+asset_digital_call\\s*\\(",
      scaffold: `import math

def bs_d1(S, K, r, q, sigma, T):
    return (math.log(S/K) + (r - q + 0.5*sigma*sigma)*T) / (sigma*math.sqrt(T))

def norm_cdf(x):
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

def asset_digital_call(S, K, r, q, sigma, T):
    """Asset-or-nothing call: PV = S*e^{-qT}*N(d1)."""
    # TODO
    return 0.0
`,
      hint: `💡 Asset digital = S·e^{−qT}·N(d1).`,
      weight: 0.3,
      tests: [
        { expr: 'import math; asset_digital_call(100, 95, 0.02, 0.01, 0.25, 1.0)', expected: 83.17255789925753, tol: 1e-3 },
        { expr: 'import math; asset_digital_call(120,100,0.03,0.01,0.20,0.5)', expected: 112.4659797654713, tol: 1e-3 },
      ],
    },

    {
      id: 'ki-maturity',
      name: '⑨ Maturity payoff with KI',
      question: 'Implement payoff_autocall_maturity(S_T, N, KI) = N if S_T ≥ KI else N·(S_T/KI).',
      detect: "def\\s+payoff_autocall_maturity\\s*\\(",
      scaffold: `def payoff_autocall_maturity(S_T, N, KI):
    """If no loss event (S_T>=KI) return N; else linear loss N*(S_T/KI)."""
    # TODO
    return 0.0
`,
      hint: `💡 Simple stylized payoff: nominal back if no knock-in loss; else linear participation.`,
      weight: 0.3,
      tests: [
        { expr: 'payoff_autocall_maturity(80, 1000, 70)', expected: 1000.0, tol: 1e-9 },
        { expr: 'payoff_autocall_maturity(60, 1000, 70)', expected: 857.1428571428571, tol: 1e-6 },
      ],
    },

    {
      id: 'worstof-trigger',
      name: '⑩ Worst-of trigger (paired names)',
      question: 'Implement worstof_trigger(S1, S2, barrier) → 1 if both ≥ barrier, else 0. Models a basket autocall check.',
      detect: "def\\s+worstof_trigger\\s*\\(",
      scaffold: `def worstof_trigger(S1, S2, barrier):
    """Return 1 if both names are above barrier at obs date, else 0."""
    # TODO
    return 0
`,
      hint: `💡 Worst-of = min(S1, S2) must exceed barrier.`,
      weight: 0.3,
      tests: [
        { expr: 'worstof_trigger(105, 98, 100)', expected: 0, tol: 0 },
        { expr: 'worstof_trigger(102, 101, 100)', expected: 1, tol: 0 },
      ],
    },

    {
      id: 'pv-coupon',
      name: '⑪ Coupon PV',
      question: 'Implement pv_coupon(cpn, t, r) = cpn·exp(−r·t).',
      detect: "def\\s+pv_coupon\\s*\\(",
      scaffold: `import math

def pv_coupon(cpn, t, r):
    """Present value of a single coupon."""
    # TODO
    return 0.0
`,
      hint: `💡 Discount each coupon at exp(−r·t).`,
      weight: 0.3,
      tests: [
        { expr: 'import math; pv_coupon(50, 1.0, 0.03)', expected: 48.52227667742541, tol: 1e-6 },
        { expr: 'import math; pv_coupon(80, 2.0, 0.025)', expected: 76.09835396005712, tol: 1e-6 },
      ],
    },
  ]}
/>
