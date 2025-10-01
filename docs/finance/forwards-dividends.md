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
