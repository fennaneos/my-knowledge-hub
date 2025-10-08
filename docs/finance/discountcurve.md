---
id: discountcurve
title: Discount Curve
sidebar_label: Discount Curve
---

import ClearStarsButton from '@site/src/components/progress/ClearStarsButton';
import ChapterStars from '@site/src/components/progress/ChapterStars';

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
  <ChapterStars chapterId="discountcurve" showLabel />
  <ClearStarsButton chapterId="discountcurve" />
</div>


# Building a Discount Curve for Pricing Structured Products

## 1. Introduction
The **discount curve** (or zero-coupon curve) is a fundamental tool in pricing derivatives and structured products. It allows us to convert future cash flows into present values by applying discount factors that are consistent with observed market prices.

---

## 2. Key Inputs
To construct a robust discount curve, the following market instruments are typically used:

1. **Short-end instruments (money market):**
   - Overnight rates
   - Deposit rates
   - OIS (overnight indexed swaps)

2. **Mid-term instruments (swap market):**
   - Futures contracts (e.g., Eurodollar or SOFR futures)
   - FRAs (forward rate agreements)
   - Interest rate swaps

3. **Long-term instruments (bonds/swaps):**
   - Swap rates with maturities from 5Y to 30Y
   - Government bond yields (if used for collateral discounting)

:::info
## 2. Key Inputs (Extended)

To construct a robust discount curve, we rely on liquid market instruments across different maturities. The main groups are:

---

### Short-End Instruments (Money Market)
- **Overnight rates (O/N):** Directly observable and form the anchor of the curve.
- **Deposit rates:** Short-term unsecured lending rates (1W, 1M, 3M).
- **Overnight Indexed Swaps (OIS):** Highly liquid, collateral-consistent instruments for short maturities.

**Why:** These products provide reliable discount factors for the first few months of the curve.

---

### Mid-Term Instruments (Swap Market)
- **Futures contracts** (e.g., Eurodollar or SOFR futures): Provide information about forward short rates.
- **FRAs (Forward Rate Agreements):** Lock in forward interest rates.
- **Interest Rate Swaps:** The most liquid instruments for maturities beyond 1Y up to ~30Y.

**Why:** Swap markets are deep and liquid, and swap par rates reflect expectations of forward rates under collateralized discounting.

---

### Long-Term Instruments (Swaps vs. Bonds)
- **Swap rates (5Y–30Y):** Quoted daily with high liquidity.
- **Government bonds:** Used occasionally, but typically less convenient for building discount curves in modern practice.

---

## 2.1 Why Use Swaps Instead of Bonds?

### 1. Direct Relation to Discount Factors
The fixed leg of a swap equates to the floating leg at par.  

:::note
### What does "The fixed leg of a swap equates to the floating leg at par" mean?

At inception, an **interest rate swap** has **zero value**.  
This means the **present value (PV) of the fixed leg equals the PV of the floating leg**:

$$
\text{PV}_{fixed} = \text{PV}_{float}
$$

---

#### 1. Fixed Leg PV
$$
\text{PV}_{\text{fixed}} = N \cdot K \sum_{i=1}^n \alpha_i D(t_i)
$$

- $$N$$ = notional  
- $$K$$ = fixed (par) swap rate  
- $$\alpha_i$$ = year fraction of period $$i$$  
- $$D(t_i)$$ = discount factor for time $$t_i$$

---

#### 2. Floating Leg PV
At initiation, the floating leg is valued as:

$$
\text{PV}_{\text{float}} = N \cdot \left(1 - D(t_n)\right)
$$

- Intuition: The floating leg is equivalent to a **par floating bond**, which always prices to par at inception.  

---

#### 3. Par Swap Condition
Equating the two sides and canceling $$N$$:

$$
K \sum_{i=1}^n \alpha_i D(t_i) = 1 - D(t_n)
$$

This is the **par swap equation** — the observed market swap rate $$K$$ makes the fixed and floating legs equal at inception.

---

✅ **Key takeaway:**  
When we say *“the fixed leg equates to the floating leg at par”*, we mean that at initiation of the swap, the value of the fixed leg equals the value of the floating leg. This property is what allows us to **bootstrap discount factors directly from swap rates**.
:::

For a swap with fixed rate $$K$$, payment dates $$t_1, t_2, \dots, t_n$$, and year fractions $$\alpha_i$$, the par swap condition is:

$$
\sum_{i=1}^n \alpha_i D(t_i) K = 1 - D(t_n)
$$

where:
- $$D(t)$$ is the discount factor at time $$t$$,
- $$K$$ is the quoted swap rate,
- The RHS comes from valuing the floating leg (par at initiation).

This gives a **direct equation** linking observed market swap rates to unknown discount factors $$D(t_i)$$.  
Bootstrapping can proceed maturity by maturity.

---

### 2. Bond Pricing vs. Swap Pricing
A government bond with coupon $$C$$, maturity $$T$$, and coupon dates $$t_1, \dots, t_n$$ has price:

$$
P_{bond} = \sum_{i=1}^n C \cdot D(t_i) + 100 \cdot D(T)
$$

The challenge with bonds:
- Bond prices include **credit risk premia** (even sovereigns can embed risk).
- Bonds may trade at **different liquidity levels** than derivatives.
- Coupon conventions vary, complicating calibration.

In contrast, swaps are standardized and reflect the risk-free curve (collateralized discounting under OIS).

---

### 3. Liquidity and Collateralization
- **Swaps:** Traded OTC with collateral agreements (CSA). Discounting is naturally aligned with OIS (risk-free).  
- **Bonds:** Exposed to repo markets, credit spreads, and supply-demand effects.  

This makes swaps the **cleaner instruments** for extracting the risk-free discount curve used in pricing structured products.

---

### 4. Summary: Mathematical Advantage
- Swaps give a **linear system of equations** in discount factors:
  $$
  \sum_{i=1}^n \alpha_i D(t_i) K = 1 - D(t_n)
  $$
  → solvable step by step (bootstrapping).
  
- Bonds give:
  $$
  P_{\text{bond}} = \sum_{i=1}^n C \cdot D(t_i) + 100 \cdot D(T)
  $$
  → introduces credit/liquidity noise and makes bootstrapping less robust.

Thus, swaps dominate in practice.

:::

---

## 3. Methodology

### Step 1: Gather Market Data
- Collect deposit rates (e.g., overnight, 1W, 1M, 3M).
- Collect futures/FRAs for the intermediate tenors.
- Collect par swap rates for the longer maturities.
- Decide on the collateral/discounting convention (OIS vs. LIBOR, post-2022 usually OIS).

### Step 2: Choose Interpolation/Extrapolation Schemes
- Decide how to interpolate between observed maturities:
  - Linear interpolation in discount factors or zero rates.
  - Cubic spline or monotone convex interpolation for smoother curves.
- Extrapolate beyond the longest available instrument if needed.

### Step 3: Bootstrapping Procedure
The curve is typically built iteratively (bootstrapping):

1. **Deposits:**  
   Solve directly for discount factors $$D(t)$$ from simple deposit contracts:
   $$
   D(t) = \frac{1}{1 + r \cdot \Delta t}
   $$

2. **Futures / FRAs:**  
   Extract forward rates from futures or FRA prices, then use them to extend the curve.

3. **Swaps:**  
   For each swap maturity, solve for the discount factor such that the **present value of fixed leg = present value of floating leg**:
   $$
   \sum_{i} \alpha_i D(t_i) K = 1 - D(T)
   $$
   where $$K$$ is the par swap rate, $$\alpha_i$$ are accrual factors, and $$D(t_i)$$ are discount factors.

4. **Iterate:**  
   Continue bootstrapping maturity by maturity, ensuring consistency across instruments.

---

## 4. Practical Considerations
- **Collateralization:**  
  Post-2008, OIS discounting is standard for collateralized trades (CSA agreements).
- **Multi-curve framework:**  
  Different curves may be needed:
  - **Discounting curve** (OIS).
  - **Projection curves** for different forward tenors (3M, 6M, etc.).
- **Day count conventions & compounding:**  
  Ensure alignment with market conventions for deposits, swaps, and futures.

---

## 5. Applications in Structured Products
Once constructed, the discount curve is used to:

1. **Discount cash flows** of exotic payoffs.
2. **Calibrate models** (e.g., Hull-White, LMM, SABR) for interest rate dynamics.
3. **Value embedded options** within structured notes (e.g., callable, range accrual).
4. **Risk management** (sensitivity to shifts in discount curve, DV01, etc.).

---

## 6. Example Workflow

1. **Input market quotes:**
   - ON: 2.50%
   - 3M deposit: 2.60%
   - Futures strip: 3M–2Y
   - Swap rates: 2Y–30Y

2. **Bootstrap curve:**
   - Step through maturities and solve for discount factors.

3. **Generate zero rates and forward rates:**
   - Zero rate $$R(t) = -\frac{\ln D(t)}{t}$$.
   - Forward rate $$f(t,T) = \frac{\ln D(t) - \ln D(T)}{T-t}$$.

4. **Use for pricing:**
   - Discount structured product payoffs using $$D(t)$$.
   - Calibrate stochastic models if optionality is present.

---

## 7. Conclusion
A well-constructed discount curve ensures:
- **Arbitrage-free valuation.**
- **Consistency** with observed market data.
- **Robustness** in pricing structured products across multiple asset classes.

---


# Discount Curve Construction Using the Pseudo-Inverse Method

## 1. Motivation
When building a discount curve from market instruments (deposits, FRAs, swaps, etc.), we end up with a system of equations linking **discount factors** to **market quotes**.

- Each market instrument provides one pricing equation.  
- The unknowns are the **discount factors** $$ P(t_0, T_i) $$.  
- Collecting all instruments gives a linear system:
  
$$
A \cdot P = b
$$

where:
- $$P$$ = vector of discount factors (unknowns),
- $$b$$ = vector of observed market prices (or normalized values like 1 for par swaps),
- $$A$$ = matrix of coefficients (cash flow weights, accrual factors, etc.).

---

## 2. The Problem
In practice:
- We often have **more equations than unknowns** (overdetermined system, since multiple instruments may cover overlapping maturities).
- The system may be **ill-conditioned** (due to correlations between instruments or redundant maturities).

This means we **cannot solve directly** with a simple inverse $$A^{-1} b$$.

---

## 3. Pseudo-Inverse Solution
To handle this, we use the **Moore–Penrose pseudo-inverse**:

$$
P = A^{+} b
$$

where:

$$
A^{+} = (A^T A)^{-1} A^T
$$

if $$A$$ has full column rank.

This solution corresponds to the **least-squares minimizer**:

$$
P = \arg \min_{P} \| A P - b \|^2
$$

In other words, the discount factors are chosen so that the pricing errors across all instruments are minimized in a quadratic sense.

---

## 4. Example (Conceptual)
Suppose:
- Unknowns: $$ P(t_0, T_1), P(t_0, T_2) $$.
- Market instruments: one FRA and two swaps → 3 equations.

This gives:
$$
A =
\begin{bmatrix}
a_{11} & a_{12} \\
a_{21} & a_{22} \\
a_{31} & a_{32}
\end{bmatrix},
\quad
b =
\begin{bmatrix}
b_1 \\
b_2 \\
b_3
\end{bmatrix}
$$

The system is overdetermined ($$3 \times 2$$). Using the pseudo-inverse:

$$
P = A^{+} b
$$

provides the best-fit discount factors.

---

## 5. Relation to Bootstrapping
- **Bootstrapping method:** solves sequentially, instrument by instrument, exact fit.  
- **Pseudo-inverse method:** solves globally, across all instruments, in a least-squares sense.  

Advantages:
- Can incorporate **all instruments simultaneously**.  
- Handles noisy or inconsistent market quotes.  
- Provides a **smooth and stable curve**, especially when data is redundant or imperfect.

---

## 6. Summary
The pseudo-inverse method provides a **robust mathematical framework** for constructing discount curves:

- Formulate all pricing equations as $$A P = b$$.  
- Solve with pseudo-inverse:
  $$
  P = (A^T A)^{-1} A^T b
  $$
- Ensures the curve is consistent with market data **in the least-squares sense**.  

This approach is particularly useful for structured products pricing, where a stable and arbitrage-free discount curve is essential.

import TryIt from '@site/src/components/tryit/TryIt';

## 9. Practical Lab — Convexity Adjustment (10 mini exercises)

<TryIt
  id="convexity-lab"
  chapterId="convexity-adjustment"
  hideTiles
  packWeight={0.3}
  starTotal={3}
  title="Forwards vs Futures — Convexity Lab"
  intro="These ten short exercises help you understand how forwards differ from futures when rates are stochastic. Each task has a visible question and two tests — write clean, correct Python!"
  packs={[

    {
      id: 'fwd-nodiv',
      name: '⭐ 1. Forward (no dividends)',
      question: 'Implement a function returning the forward price without dividends, using the cost-of-carry formula \( F = S e^{rT} \).',
      detect: "def\\s+forward_price\\s*\\(",
      scaffold: `import math

def forward_price(S, r, T):
    """Forward with no dividends: F = S * exp(r*T)."""
    # TODO
    return 0
`,
      hint: `💡 Hint
Use math.exp for e^(x).`,
      tests: [
        { expr: "import math; forward_price(100, 0.03, 2)", expected: 106.183655, tol: 1e-3 },
        { expr: "import math; forward_price(80, 0.015, 1.5)", expected: 81.820403, tol: 1e-3 },
      ],
    },

    {
      id: 'fwd-yield',
      name: '⭐ 2. Forward with continuous yield',
      question: 'Extend the previous function to include a continuous dividend yield \(q\): \( F = S e^{(r-q)T} \).',
      detect: "def\\s+forward_yield\\s*\\(",
      scaffold: `import math

def forward_yield(S, r, q, T):
    """Forward with continuous yield q: F = S * exp((r-q)*T)."""
    # TODO
    return 0
`,
      hint: `💡 Hint
Subtract q from r inside the exponent.`,
      tests: [
        { expr: "import math; forward_yield(120, 0.04, 0.02, 1.0)", expected: 122.424161, tol: 1e-3 },
        { expr: "import math; forward_yield(95, 0.03, 0.015, 2.0)", expected: 97.893181, tol: 1e-3 },
      ],
    },

    {
      id: 'bank-account',
      name: '⭐ 3. Bank Account Growth',
      question: 'Simulate a bank account under continuous compounding: \( B_T = B_0 e^{\\sum r_iΔt_i} \). Use given short rates and time steps.',
      detect: "def\\s+bank_account\\s*\\(",
      scaffold: `import math

def bank_account(B0, rates, dts):
    """Accumulate a bank account under varying short rates."""
    # TODO
    return 0
`,
      hint: `💡 Hint
Sum r_i·Δt_i, exponentiate once.`,
      tests: [
        { expr: "import math; bank_account(1.0, [0.02,0.025,0.03], [0.5,0.5,1.0])", expected: 1.053903, tol: 1e-6 },
        { expr: "import math; bank_account(2.0, [0.01,0.012], [0.5,0.5])", expected: 2.023062, tol: 1e-6 },
      ],
    },

    {
      id: 'zerocoupon',
      name: '⭐ 4. Zero-Coupon Discount Factor',
      question: 'Compute the discount factor for a zero-coupon bond: \( P(t,T) = e^{-\\sum r_iΔt_i} \).',
      detect: "def\\s+zero_coupon\\s*\\(",
      scaffold: `import math

def zero_coupon(rates, dts):
    """Return discount factor P(t,T) = exp(-sum(r_i * dt_i))."""
    # TODO
    return 0
`,
      hint: `💡 Hint
Same as the bank account but with a negative sign.`,
      tests: [
        { expr: "import math; zero_coupon([0.02,0.025,0.03], [0.5,0.5,1.0])", expected: 0.948854, tol: 1e-6 },
        { expr: "import math; zero_coupon([0.01,0.012,0.013], [0.25,0.25,0.5])", expected: 0.987226, tol: 1e-6 },
      ],
    },

    {
      id: 'fut-eq-fwd-det',
      name: '⭐ 5. Futures = Forward (deterministic rates)',
      question: 'Show that when interest rates are deterministic, futures and forward prices are equal — compute \( F_{fut} - F_{fwd} = 0 \).',
      detect: "def\\s+futures_minus_forward_det\\s*\\(",
      scaffold: `import math

def futures_minus_forward_det(S, r, q, T):
    """Return F_fut - F_fwd under deterministic rates."""
    # TODO
    return 1.0  # placeholder
`,
      hint: `💡 Hint
Use F = S * exp((r-q)*T) for both.`,
      tests: [
        { expr: "import math; futures_minus_forward_det(100,0.03,0.01,1.0)", expected: 0.0, tol: 1e-9 },
        { expr: "import math; futures_minus_forward_det(250,0.02,0.015,2.0)", expected: 0.0, tol: 1e-9 },
      ],
    },

    {
      id: 'cov-pop',
      name: '⭐ 6. Population Covariance',
      question: 'Implement the population covariance \( \\text{Cov}(X,Y) = \\frac{1}{n}\\sum_i(x_i-\\bar{x})(y_i-\\bar{y}) \).',
      detect: "def\\s+cov_pop\\s*\\(",
      scaffold: `def cov_pop(x, y):
    """Population covariance: mean((x - mean_x)*(y - mean_y))."""
    # TODO
    return 0.0
`,
      hint: `💡 Hint
Compute means, then average product of deviations.`,
      tests: [
        { expr: "cov_pop([1,2,3], [2,4,6])", expected: 4.0/3.0, tol: 1e-9 },
        { expr: "cov_pop([0,2,4,6], [1,1,3,5])", expected: 2.0, tol: 1e-9 },
      ],
    },

    {
      id: 'fut-approx',
      name: '⭐ 7. Convexity Approximation Formula',
      question: 'Derive the convexity adjustment approximation \( F_{fut} \\approx F_{fwd} e^{0.5σ_Sσ_rρτ^2} \).',
      detect: "def\\s+fut_from_fwd_approx\\s*\\(",
      scaffold: `import math

def fut_from_fwd_approx(F_fwd, sigmaS, sigmaR, rho, tau):
    """Futures ≈ Forward × exp(0.5 * sigmaS * sigmaR * rho * tau^2)."""
    # TODO
    return 0
`,
      hint: `💡 Hint
Use math.exp(0.5 * σS * σr * ρ * τ²).`,
      tests: [
        { expr: "import math; fut_from_fwd_approx(105, 0.2, 0.01, 0.3, 2.0)", expected: 105.126076, tol: 1e-6 },
        { expr: "import math; fut_from_fwd_approx(90, 0.25, 0.015, -0.2, 1.5)", expected: 89.924512, tol: 1e-6 },
      ],
    },

    {
      id: 'adj-diff',
      name: '⭐ 8. Convexity Difference',
      question: 'Compute the difference between futures and forward: \( Δ = F_{fwd}(e^{0.5σ_Sσ_rρτ²}-1) \).',
      detect: "def\\s+convexity_diff\\s*\\(",
      scaffold: `import math

def convexity_diff(F_fwd, sigmaS, sigmaR, rho, tau):
    """Return F_fut − F_fwd via convexity adjustment."""
    # TODO
    return 0
`,
      hint: `💡 Hint
Compute exp(...)-1, multiply by F_fwd.`,
      tests: [
        { expr: "import math; convexity_diff(105, 0.2, 0.01, 0.3, 2.0)", expected: 0.126076, tol: 1e-6 },
        { expr: "import math; convexity_diff(200, 0.15, 0.02, 0.1, 3.0)", expected: 0.090152, tol: 1e-6 },
      ],
    },

    {
      id: 'sign-from-rho',
      name: '⭐ 9. Correlation Sign',
      question: 'Return "positive", "zero", or "negative" depending on the sign of correlation \(ρ\).',
      detect: "def\\s+adj_sign\\s*\\(",
      scaffold: `def adj_sign(rho):
    """Return 'positive' if rho>0, 'zero' if 0, else 'negative'."""
    # TODO
    return ''
`,
      hint: `💡 Hint
Simple if/elif/else logic.`,
      tests: [
        { expr: "adj_sign(0.35)", expected: "positive", tol: 0 },
        { expr: "adj_sign(0.0)", expected: "zero", tol: 0 },
      ],
    },

    {
      id: 'fwd-from-expectation',
      name: '⭐ 10. Forward from Expectation',
      question: 'Under the T-forward measure, compute \( F = \\frac{E[S_T]}{P(t,T)} \).',
      detect: "def\\s+forward_from_expectation\\s*\\(",
      scaffold: `def forward_from_expectation(E_ST, P_tT):
    """Compute forward from expected future spot and discount factor."""
    # TODO
    return 0
`,
      hint: `💡 Hint
Return E_ST / P_tT.`,
      tests: [
        { expr: "forward_from_expectation(100.0, 0.95)", expected: 105.26315789473685, tol: 1e-9 },
        { expr: "forward_from_expectation(130.0, 0.9)", expected: 144.44444444444446, tol: 1e-9 },
      ],
    },

  ]}
/>
