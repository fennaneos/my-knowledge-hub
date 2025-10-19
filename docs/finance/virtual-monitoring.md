---
id: virtual-monitoring
title: Virtual Monitoring (Explainer)
sidebar_label: Virtual Monitoring
slug: /finance/virtual-monitoring
description: How our Virtual Monitoring computes model-based, non-binding prices and how to cite them.
---

import ExplainerBuilder from '@site/src/components/ExplainerBuilder';

<div className="premiumBadge">
  <div><b>Free</b></div>
  <div>Explains how our <b>Virtual Monitoring</b> panel computes model-based, non-binding prices and how to cite them.</div>
</div>

# 💡 Virtual Monitoring — Explainer

Virtual Monitoring produces a **model-driven, non-binding** price *and* a plain-English explanation you can reference publicly.  
It does **not** scrape protected sources or execute trades.

> Looking for skew/smile intuition? See **[Skew & Smile](/finance/skew-smile)**.

---

## Models (math)

- **Black–Scholes (Call)**  
  $$
  C = S\,N(d_1) - K e^{-rT} N(d_2), \quad
  d_1=\frac{\ln(S/K)+(r+\tfrac12\sigma^2)T}{\sigma\sqrt{T}},\;
  d_2=d_1-\sigma\sqrt{T}
  $$

- **Bollinger Baseline**  
  $$
  SMA = \frac{1}{n}\sum S_t,\quad U = SMA + 2\sigma,\; L = SMA - 2\sigma
  $$

- **EMA Fair Value**  
  $$
  EMA_t = \alpha S_t + (1-\alpha)EMA_{t-1},\quad \alpha=\frac{2}{n+1}
  $$

- **Skew/Smile (beta)** – educational proxy: adjust $ \sigma $ with moneyness.

---

## Generate a shareable write-up

<ExplainerBuilder />

---

## FAQ

**Is this financial advice?** No — outputs are educational/disclosure aids.  
**Where is the live “Realistic Monitoring”?** In the app (Pro): live fetch, deltas, audit trail.
