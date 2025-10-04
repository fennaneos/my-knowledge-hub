import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from math import log, sqrt, exp
from scipy.stats import norm
from scipy.optimize import brentq

# --- Black-Scholes functions ---
def bs_price(S, K, T, r, sigma, option="call"):
    d1 = (log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*sqrt(T))
    d2 = d1 - sigma*sqrt(T)
    if option == "call":
        return S*norm.cdf(d1) - K*exp(-r*T)*norm.cdf(d2)
    else:
        return K*exp(-r*T)*norm.cdf(-d2) - S*norm.cdf(-d1)

def implied_vol(S, K, T, r, market_price, option="call"):
    # Solve for sigma
    try:
        f = lambda sigma: bs_price(S,K,T,r,sigma,option) - market_price
        return brentq(f, 1e-6, 5.0)
    except:
        return np.nan

# --- Parameters ---
S0 = 100
r = 0.01
T = 0.5  # 6 months
strikes = np.arange(70, 131, 5)

# --- Create synthetic market prices with a skew ---
# ATM vol ~ 20%, skew down for puts
true_vols = 0.20 + 0.25*((strikes/S0 - 1)**2) - 0.05*(strikes/S0 - 1)
market_prices = [bs_price(S0, K, T, r, sigma, "call") for K,sigma in zip(strikes,true_vols)]

# --- Back out implied vols from synthetic prices ---
implied_vols = [implied_vol(S0, K, T, r, price, "call") for K,price in zip(strikes,market_prices)]

# --- Build dataframe ---
df = pd.DataFrame({
    "Strike": strikes,
    "MarketPrice": market_prices,
    "ImpliedVol": implied_vols,
    "TrueVol": true_vols
})
print(df)

# --- Plot ---
plt.style.use("dark_background")
plt.figure(figsize=(10,6))
plt.plot(strikes, true_vols, "gold", lw=2, label="True Vol (model)")
plt.scatter(strikes, implied_vols, color="red", label="Implied Vol (from market prices)")
plt.axvline(S0, color="gray", linestyle="--", label="ATM")
plt.title("Synthetic Volatility Smile", color="gold", fontsize=14)
plt.xlabel("Strike")
plt.ylabel("Implied Volatility")
plt.legend()
plt.show()
