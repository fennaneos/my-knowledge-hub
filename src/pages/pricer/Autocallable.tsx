import React, { useState } from "react";
import Layout from "@theme/Layout";
import HelpTip from "../../components/HelpTip";

export default function Autocallable() {
  const [spot, setSpot] = useState(100);
  const [coupon, setCoupon] = useState(0.12);
  const [barrier, setBarrier] = useState(0.7);
  const [koDates, setKoDates] = useState(12);
  const [vol, setVol] = useState(0.25);
  const [rho, setRho] = useState(0.2);

  return (
    <Layout
      title="Autocallable / Phoenix"
      description="MC-based probability of autocall and coupon PV"
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "18px 16px 60px",
          display: "grid",
          gap: 14,
        }}
      >
        <div className="panel" style={{ padding: 16 }}>
          <div
            className="panelHeader"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <h1 style={{ margin: 0 }}>Autocallable / Phoenix</h1>
              <span className="lux-chip">Structured</span>
              <span
                className="lux-chip"
                style={{
                  border: "1px solid rgba(255,255,255,.25)",
                  background: "rgba(255,60,60,.15)",
                }}
              >
                PRO
              </span>
              <HelpTip title="Idea">
                Autocalls if underlying ≥ KO level on observation dates.
                Coupons accrue; barrier protection may apply at maturity.
              </HelpTip>
            </div>

            <div className="cta-group">
              <a className="btn-neo-blue" href="/products">
                ← Workbench
              </a>
              <a className="btn-neo-red-modern" href="/pricing-labs">
                Upgrade to Pro
              </a>
            </div>
          </div>

          <div
            className="panelBody"
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: 12,
            }}
          >
            <div className="panel" style={{ padding: 12 }}>
              <div className="panelHeader">Setup</div>
              <div
                className="panelBody"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 10,
                }}
              >
                <label style={{ display: "grid", gap: 4 }}>
                  <span>Spot</span>
                  <input
                    className="num"
                    type="number"
                    value={spot}
                    onChange={(e) =>
                      setSpot(parseFloat(e.target.value || "0"))
                    }
                  />
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                  <span>Coupon (annual)</span>
                  <input
                    className="num"
                    type="number"
                    step="0.01"
                    value={coupon}
                    onChange={(e) =>
                      setCoupon(parseFloat(e.target.value || "0"))
                    }
                  />
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                  <span>KO Level (× Spot)</span>
                  <input
                    className="num"
                    type="number"
                    step="0.01"
                    value={1.0}
                    disabled
                  />
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                  <span>Barrier (× Spot)</span>
                  <input
                    className="num"
                    type="number"
                    step="0.01"
                    value={barrier}
                    onChange={(e) =>
                      setBarrier(parseFloat(e.target.value || "0"))
                    }
                  />
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                  <span>Obs. Months</span>
                  <input
                    className="num"
                    type="number"
                    value={koDates}
                    onChange={(e) =>
                      setKoDates(parseInt(e.target.value || "0"))
                    }
                  />
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                  <span>σ (vol)</span>
                  <input
                    className="num"
                    type="number"
                    step="0.01"
                    value={vol}
                    onChange={(e) =>
                      setVol(parseFloat(e.target.value || "0"))
                    }
                  />
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                  <span>ρ (basket)</span>
                  <input
                    className="num"
                    type="number"
                    step="0.01"
                    value={rho}
                    onChange={(e) =>
                      setRho(parseFloat(e.target.value || "0"))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="panel" style={{ padding: 12 }}>
              <div className="panelHeader">Results</div>
              <div className="panelBody" style={{ display: "grid", gap: 8 }}>
                <div style={{ opacity: 0.8 }}>
                  This is a <b>PRO</b> feature. Upgrade to run Monte-Carlo and
                  see:
                </div>
                <ul style={{ margin: "6px 0 0 18px" }}>
                  <li>Autocall probability / expected time</li>
                  <li>Coupon PV and loss distribution</li>
                  <li>Barrier hit probability and tail risk</li>
                </ul>
                <a className="btn-neo-red-modern" href="/pricing-labs">
                  Get Pro
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
