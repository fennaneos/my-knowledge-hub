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
