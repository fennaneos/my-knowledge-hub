import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";

export default function PricerHomeClient() {
  return (
    <Layout title="Pricer">
      <div style={{padding:24}}>
        <h1>Pricer</h1>
        <ul>
          <li><Link to="/pricer/Vanilla">Vanilla Pricer</Link></li>
        </ul>
      </div>
    </Layout>
  );
}
