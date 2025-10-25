import React from "react";
import Layout from "@theme/Layout";

export default function Autocallable() {
  return (
    <Layout title="Autocallable / Phoenix" description="Path-dependent couponed note">
      <div style={{maxWidth: 1000, margin: "0 auto", padding: "24px 16px"}}>
        <h1>Autocallable / Phoenix</h1>
        <p>KO schedule, coupons, barrier logic. (Hook to your simulator.)</p>
        <a className="btn-ghost-blue" href="/pricer">← Back to Pricer hub</a>
      </div>
    </Layout>
  );
}
