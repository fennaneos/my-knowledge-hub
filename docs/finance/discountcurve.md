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
