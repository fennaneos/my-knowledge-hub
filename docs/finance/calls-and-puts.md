---
id: calls-and-puts
title: Calls and Puts Explained
sidebar_label: Calls & Puts
---

import ChapterStars from '@site/src/components/progress/ChapterStars';
import ClearStarsButton from '@site/src/components/progress/ClearStarsButton';

<div
  className="gold-glow"
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid rgba(212,175,55,0.25)',
    borderRadius: 12,
    padding: '8px 14px',
    marginBottom: '12px',
  }}
>
  <ChapterStars chapterId="calls-and-puts" showLabel />
  <ClearStarsButton chapterId="calls-and-puts" />
</div>

# 📈 Call and Put Options

Options are the **building blocks of derivatives markets**.  
Understanding calls and puts is crucial for trading, risk management, and interviews.

---

## 🔑 Definitions

### Call Option

A **call** gives the right (but not obligation) to **buy** the underlying at strike $K$ at (or before) maturity $T$:

$$
C_T = \max(S_T - K, 0)
$$

### Put Option

A **put** gives the right (but not obligation) to **sell** at $K$:

$$
P_T = \max(K - S_T, 0)
$$

---

## ⚖️ General Put–Call Parity (Any $t \leq T$)

Put–call parity holds **at any time $t$** under no-arbitrage:

$$
C_t - P_t = F_t - K e^{-r (T - t)}
$$

where $F_t = S_t e^{(r - q)(T - t)}$ is the forward price at $t$.

**Derivation intuition:**

- **Portfolio 1:** Long call + present value of strike ($K e^{-r(T - t)}$)
- **Portfolio 2:** Long put + long forward

At $T$, both portfolios pay:

$$
\max(S_T - K, 0) + K = \max(K - S_T, 0) + S_T
$$

hence they are **identical in payoff** → must have same value today.

> 💡 **Special Case:** If $t = 0$ and $q = 0$ (no dividends):
> 
> $$
> C_0 - P_0 = S_0 - K e^{-rT}
> $$

---

## 💰 Option Pricing via Risk-Neutral Expectation

### Call Price

$$
C_t = e^{-r (T - t)} \mathbb{E}^{\mathbb{Q}}\!\big[(S_T - K)^+ \mid \mathcal{F}_t\big]
$$

### Put Price

$$
P_t = e^{-r (T - t)} \mathbb{E}^{\mathbb{Q}}\!\big[(K - S_T)^+ \mid \mathcal{F}_t\big]
$$

---

## 📊 Greeks — Sensitivities and Intuition

Greeks measure how option value responds to **market parameters**.  

| Greek | Formula | Call Sign | Put Sign | Intuition |
|------|---------|-----------|----------|-----------|
| **Delta** $\Delta$ | $\frac{\partial V}{\partial S}$ | $[0, 1]$ | $[-1, 0]$ | Call behaves like long stock, put like short stock |
| **Gamma** $\Gamma$ | $\frac{\partial^2 V}{\partial S^2}$ | $> 0$ | $> 0$ | Convexity — both gain from large moves |
| **Theta** $\Theta$ | $\frac{\partial V}{\partial t}$ | Usually $< 0$ | Usually $< 0$ | Time decay eats premium |
| **Vega** | $\frac{\partial V}{\partial \sigma}$ | $> 0$ | $> 0$ | More vol → more value (convex payoff) |
| **Rho** $\rho$ | $\frac{\partial V}{\partial r}$ | $> 0$ | $< 0$ | Higher rates ↑ call (forward up), ↓ put |

---

### 🔎 Intuition for Each Greek

- **Delta:** "Shares equivalent" → ATM call ≈ 0.5, ATM put ≈ −0.5
- **Gamma:** Measures *how fast delta changes* → highest for ATM short-dated options
- **Theta:** Premium decays faster near expiry, ATM options lose value quickest
- **Vega:** Highest for ATM options, decreases as maturity shortens (less exposure to vol)
- **Rho:** Usually small unless rates are large or maturities long

---

### 📚 ATM Case Study (European Call)

Let $S_0 = K$, $T = 0.5$ year, $\sigma = 20\%$:

- **Delta:** ≈ 0.5 (call has 50% chance of finishing ITM under $\mathbb{Q}$)
- **Gamma:** Large → delta changes quickly with $S$
- **Theta:** Negative → loses value each day without move
- **Vega:** Highest at ATM → most sensitive to vol changes

---

### 🏋️ Mini Exercises

1. **Put–Call Parity Check**

Given $S_0 = 100$, $K = 100$, $r = 5\%$, $T = 1$, $q=0$:

- Market prices: $C_0 = 8.5$, $P_0 = ?$
- Compute $P_0$ using parity:

$$
P_0 = C_0 + K e^{-rT} - S_0
$$

---

2. **Theta Sign Intuition**

Explain why **Theta < 0** for calls (long premium positions) but **Theta > 0** for short options (option writers earn time decay).

---

3. **Vega Intuition**

Show numerically (e.g. with Black–Scholes) that:

$$
\frac{\partial C}{\partial \sigma} > 0, \quad
\frac{\partial P}{\partial \sigma} > 0
$$

---

## 🧮 Black–Scholes–Merton Formulas

European call:

$$
C_0 = S_0 e^{-qT} N(d_1) - K e^{-rT} N(d_2)
$$

European put:

$$
P_0 = K e^{-rT} N(-d_2) - S_0 e^{-qT} N(-d_1)
$$

with

$$
d_1 = \frac{\ln\frac{S_0}{K} + (r - q + \frac{1}{2}\sigma^2)T}{\sigma \sqrt{T}}, \quad
d_2 = d_1 - \sigma \sqrt{T}
$$

---

## 🧠 Typical Interview Questions

- **Explain put–call parity and derive it**  
- **Impact of dividends on calls/puts?**  
- **Signs of Greeks — why rho is negative for puts?**  
- **ATM delta ≈ 0.5 — intuition?**  
- **Why do OTM puts have high implied vol (negative skew)?**

---

## ✅ Key Takeaways

- Put–call parity is **always valid** under no-arbitrage  
- Greeks give insight into **risk exposures**  
- ATM cases are most sensitive to delta, gamma, vega  
- Understanding **signs** (e.g. rho, theta) is a common interview test

---

## 💰 Option Premium

The **option price (premium)** at $t=0$ is the **present value** of the expected payoff under the risk-neutral measure $\mathbb{Q}$:

### Call Price

$$
C_0 = e^{-rT} \mathbb{E}^{\mathbb{Q}}\big[\max(S_T - K, 0)\big]
$$

### Put Price

$$
P_0 = e^{-rT} \mathbb{E}^{\mathbb{Q}}\big[\max(K - S_T, 0)\big]
$$

---

## 🧠 Intuition

- **Call = bullish bet** (benefits from price increase)
- **Put = bearish / protective hedge** (benefits from price drop)

---

## ⚖️ Put–Call Parity

A key arbitrage relation:

$$
C_0 - P_0 = F_0 - K e^{-rT}
$$

where $F_0 = S_0 e^{(r - q)T}$ is the forward price (with dividend yield $q$).

**Interpretation:**  
A call + cash replicates a put + forward contract.

---

## 📊 Greeks (Sensitivities)

| Greek | Call | Put | Intuition |
|------|------|------|-----------|
| $\Delta = \frac{\partial V}{\partial S}$ | $[0,1]$ | $[-1,0]$ | Sensitivity to $S$ |
| $\Gamma = \frac{\partial^2 V}{\partial S^2}$ | $>0$ | $>0$ | Convexity |
| $\Theta = \frac{\partial V}{\partial t}$ | $\text{usually}<0$ | $\text{usually}<0$ | Time decay |
| $Vega = \frac{\partial V}{\partial \sigma}$ | $>0$ | $>0$ | Value rises with vol |
| $\rho = \frac{\partial V}{\partial r}$ | $>0$ | $<0$ | Call up, put down if rates rise |

---

## 🏦 Effect of Dividends

### Discrete Dividends

Forward price adjusted for PV of dividends $D$:

$$
F_0 = (S_0 - \text{PV}(D)) e^{rT}
$$

### Continuous Dividend Yield $q$

$$
F_0 = S_0 e^{(r - q)T}
$$

Dividends **lower the forward**, so calls lose value, puts gain value.

---

## 🧮 Black–Scholes–Merton Formula

European call:

$$
C_0 = S_0 e^{-qT} N(d_1) - K e^{-rT} N(d_2)
$$

European put:

$$
P_0 = K e^{-rT} N(-d_2) - S_0 e^{-qT} N(-d_1)
$$

where

$$
d_1 = \frac{\ln\frac{S_0}{K} + (r - q + \frac{1}{2}\sigma^2)T}{\sigma \sqrt{T}}, \quad
d_2 = d_1 - \sigma \sqrt{T}
$$

---

## 🧠 Typical Interview Questions & Answers

### Q1: **Explain Put–Call Parity**
A:  
$$
C - P = F_0 - K e^{-rT}
$$  
Meaning: **Long call + PV(K)** = **Long put + forward contract**.

---

### Q2: 📈 Forward Price on an Asset Paying Dividends

We derive the forward price $$F_0(T)$$ via **replication portfolios** and absence of arbitrage (AOA).

---

## 🔑 Step 1 — Prepaid Forward

### Case A: Discrete **cash dividends** \(D_i\)

Replicate a **prepaid forward** (pay today, receive asset at $$T$$) by:

- Buying one share today
- **Rebating away** all dividends $$D_i$$ received before T

Cost today:

$$
F_0^{\text{prepaid}}(T)
= S_0 - \sum_{i=1}^n D_i e^{-r t_i}
$$

where $$t_i < T$$ are dividend dates.

---

### Case B: Continuous Dividend Yield \(q\)

If the asset pays a proportional yield $$q$$ continuously:

$$
F_0^{\text{prepaid}}(T)
= S_0 e^{-qT}
$$

Interpretation: owning the asset leaks income at rate $$q$$, so the prepaid forward costs less than $$S_0$$.

---

## 🔑 Step 2 — From Prepaid to Forward

A standard forward pays at $$T$$.  
Finance the prepaid forward at the risk-free rate $$r$$ over $$T$$:

$$
F_0(T) = F_0^{\text{prepaid}}(T) \; e^{rT}
$$

---

## 📊 Final Forward Pricing Formulas

### Discrete Dividends

$$
\boxed{F_0(T) = \Big(S_0 - \sum_{i=1}^n D_i e^{-r t_i}\Big) e^{rT}}
$$

### Continuous Dividend Yield \(q\)

$$
\boxed{F_0(T) = S_0 e^{(r - q)T}}
$$

---

## 🧠 Replication Argument (AOA)

- **Portfolio A (own & rebate):**  
  Buy one share today, short deposits delivering $$D_i$$ on each $$t_i$$.  
  Net cost $$(S_0 - PV(dividends))$$.  
  At \(T\): own one share, no dividend exposure.

- **Portfolio B (prepaid forward):**  
  Pay $$F_0^{prepaid}$$ today, receive one share at T.

Since both pay exactly one share at \(T\), prices must match.  
To turn into a forward (pay at \(T\)), finance $$(F_0^{prepaid})$$ at $$r$$.

---

## 🏋️ Quick Exercises

1. **Single Dividend Example**

Given:
- \(S_0 = 100\), \(D=3\) at \(t_D=0.5\), \(r=5\%\), \(T=1\)

Compute:

$$
F_0 = \big(100 - 3 e^{-0.05 \times 0.5}\big) e^{0.05}
$$

---

2. **Continuous Yield Example**

If \(q=2\%\):

$$
F_0 = 100 e^{(0.05 - 0.02) \times 1} = 100 e^{0.03}
$$

---

## ✅ Key Takeaway

> **Forward = Spot − PV(dividends) grown at \(r\)**  
> Continuous yield case is just the smooth version:  
> $$F_0 = S_0 e^{(r - q)T}$$.



---


---

### Q3: **Why Is Vega Always Positive?**
Because option value increases with uncertainty.  
Mathematically:

$$
\frac{\partial C}{\partial \sigma} > 0, \quad
\frac{\partial P}{\partial \sigma} > 0
$$

---

### Q4: **Effect of Interest Rates**
- Call price $\uparrow$ when $r \uparrow$ (forward up, call more valuable)
- Put price $\downarrow$ when $r \uparrow$

---

### Q5: **What Happens to Delta Near Maturity?**
- Call delta $\to 1$ if $S_T > K$, else $\to 0$
- Put delta $\to 0$ if $S_T > K$, else $\to -1$

---

### Q6: **Replicating a Call**
- Long $\Delta$ shares of stock  
- Long position in bond financing the remaining cost  
- Dynamic hedging keeps portfolio equal to call payoff

---

### Q7: **Why Do We Care About Gamma?**
Gamma measures **convexity** — high gamma means delta changes quickly → expensive to hedge → valuable to market makers.

---

### Q8: **Why Are OTM Puts So Expensive?**
Crash risk premium → negative skew → high implied vol for low strikes.

---

### Q9: **Why Does Volatility Smile Exist?**
Because returns are not lognormal — markets price fat tails and jumps → smile or skew.

---

### Q10: **How to Hedge an Option?**
- Delta-hedge with underlying
- Vega-hedge with other options
- Theta + Gamma risk balanced via portfolio construction

---

## 📚 References

- Hull, *Options, Futures, and Other Derivatives*  
- Gatheral, *The Volatility Surface*  
- Wilmott, *Derivatives: The Theory and Practice of Financial Engineering*

---

## ✅ Key Takeaways

- **Calls = right to buy**, **puts = right to sell**  
- **Put–call parity** is the cornerstone of arbitrage-free pricing  
- Rates, dividends, and volatility affect option value in predictable ways  
- Understanding **Greeks** is crucial for risk management and interviews  

---
import TryIt from '@site/src/components/tryit/TryIt';

## 🧪 Hands-On — One terminal, 4 exercises

<TryIt
  id="cp-all"
  chapterId="calls-and-puts"
  hideTiles
  packWeight={0.75}
  starTotal={3}
  title="Calls & Puts — Mini Lab"
  intro="Complete the functions below, then click Run tests. Each exercise has 2 tests and is worth ¾★."
  packs={[
    {
      id: 'parity_put',
      name: '⭐ Put–Call Parity (solve P)',
      detect: "def\\s+put_from_parity\\s*\\(",
      scaffold: `import math

def put_from_parity(C, S, K, r, q, T):
    \"\"\"Return P from put–call parity with continuous yield q:
    C - P = S*e^{-qT} - K*e^{-rT}
    => P = C - (S*e^{-qT} - K*e^{-rT})
    \"\"\"
    # TODO: implement the formula correctly
    return 0
`,
      hint: `💡 Hint
Use math.exp(x) for e^x. With continuous yield q:
P = C - (S*e^{-qT} - K*e^{-rT})`,
      weight: 0.75,
      tests: [
        {
          expr: ['import math','C=8.5; S=100; K=100; r=0.05; q=0.0; T=1','put_from_parity(C,S,K,r,q,T)'].join('; '),
          expected: Number((8.5 - (100*Math.exp(-0*1) - 100*Math.exp(-0.05*1))).toFixed(6)), // 3.622942
          tol: 1e-3,
        },
        {
          expr: ['import math','C=14; S=120; K=110; r=0.03; q=0.01; T=0.5','put_from_parity(C,S,K,r,q,T)'].join('; '),
          expected: Number((14 - (120*Math.exp(-0.01*0.5) - 110*Math.exp(-0.03*0.5))).toFixed(6)), // ~2.960816
          tol: 1e-3,
        },
      ],
    },
    {
      id: 'parity_call',
      name: '⭐ Put–Call Parity (solve C)',
      detect: "def\\s+call_from_parity\\s*\\(",
      scaffold: `import math

def call_from_parity(P, S, K, r, q, T):
    \"\"\"Return C from put–call parity:
    C = P + (S*e^{-qT} - K*e^{-rT})
    \"\"\"
    # TODO
    return 0
`,
      hint: `💡 Hint
C = P + (S*e^{-qT} - K*e^{-rT})`,
      weight: 0.75,
      tests: [
        {
          expr: ['import math','P=3.622942; S=100; K=100; r=0.05; q=0.0; T=1','call_from_parity(P,S,K,r,q,T)'].join('; '),
          expected: Number((3.622942 + (100*Math.exp(-0*1) - 100*Math.exp(-0.05*1))).toFixed(6)), // 8.5
          tol: 1e-3,
        },
        {
          expr: ['import math','P=2.960816; S=120; K=110; r=0.03; q=0.01; T=0.5','call_from_parity(P,S,K,r,q,T)'].join('; '),
          expected: Number((2.960816 + (120*Math.exp(-0.01*0.5) - 110*Math.exp(-0.03*0.5))).toFixed(6)), // ~14
          tol: 1e-3,
        },
      ],
    },
    {
      id: 'call_payoff',
      name: '⭐ Call payoff',
      detect: "def\\s+call_payoff\\s*\\(",
      scaffold: `def call_payoff(S, K):
    \"\"\"Return (S - K)+.\"\"\"
    # TODO
    return 0
`,
      hint: `💡 Hint
Max of (S-K) and 0.`,
      weight: 0.75,
      tests: [
        {
          expr: ['S=105; K=100','call_payoff(S,K)'].join('; '),
          expected: 5,
          tol: 1e-9,
        },
        {
          expr: ['S=95; K=100','call_payoff(S,K)'].join('; '),
          expected: 0,
          tol: 1e-9,
        },
      ],
    },
    {
      id: 'put_payoff',
      name: '⭐ Put payoff',
      detect: "def\\s+put_payoff\\s*\\(",
      scaffold: `def put_payoff(S, K):
    \"\"\"Return (K - S)+.\"\"\"
    # TODO
    return 0
`,
      hint: `💡 Hint
Max of (K-S) and 0.`,
      weight: 0.75,
      tests: [
        {
          expr: ['S=95; K=100','put_payoff(S,K)'].join('; '),
          expected: 5,
          tol: 1e-9,
        },
        {
          expr: ['S=105; K=100','put_payoff(S,K)'].join('; '),
          expected: 0,
          tol: 1e-9,
        },
      ],
    },
  ]}
/>
