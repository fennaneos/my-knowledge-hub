// src/pages/products.tsx
import React from "react";
import Layout from "@theme/Layout";
import ProductGrid from "../components/ProductGrid";

export default function ProductsPage() {
  return (
    <Layout title="Products" description="Catalog of pricing tools with live previews">
      <div style={{maxWidth: 1100, margin: "0 auto", padding: "22px 14px 60px"}}>
        <section style={{textAlign:"center", marginBottom: 18}}>
          <h1 style={{fontSize: 44, margin: 0}}>Price. Simulate. Understand.</h1>
          <p style={{opacity:.85, marginTop: 8}}>
            Live previews of underlyings, with quick links to each pricer. Works offline (demo) and upgrades to live when a data
            provider is configured.
          </p>
        </section>
        <ProductGrid />
      </div>
    </Layout>
  );
}
