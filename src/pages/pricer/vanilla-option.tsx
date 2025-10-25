import React from "react";
import Layout from "@theme/Layout";

export default function VanillaOption() {
  return (
    <Layout title="Vanilla Option" description="Black–Scholes pricer">
      <div style={{maxWidth: 1000, margin: "0 auto", padding: "24px 16px"}}>
        <h1>Vanilla Option (Black–Scholes)</h1>
        <p>Calls/Puts, Greeks, IV. (Implement UI + formulas here.)</p>
        <a className="btn-ghost-blue" href="/pricer">← Back to Pricer hub</a>
      </div>
    </Layout>
  );
}
