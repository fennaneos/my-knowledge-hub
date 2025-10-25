// src/components/ProductGrid.tsx
import React, { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { PRODUCTS, CATEGORIES, type ProductCategory } from "../lib/products";

export default function ProductGrid() {
  const [cat, setCat] = useState<ProductCategory | "All">("All");
  const items = useMemo(
    () => (cat === "All" ? PRODUCTS : PRODUCTS.filter(p => p.category === cat)),
    [cat]
  );

  return (
    <div style={{display:"grid", gap:16}}>
      {/* Tabs */}
      <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
        {["All", ...CATEGORIES].map((c) => (
          <button
            key={c}
            className={cat === c ? "btn-neo-blue" : "btn-ghost-blue"}
            onClick={() => setCat(c as any)}
          >
            {c}
          </button>
        ))}
        <div style={{marginLeft:"auto"}} className="cta-group">
          <a className="btn-neo-red-modern" href="/pricing-labs">Get Pro</a>
          <a className="btn-ghost-blue" href="/lab">Open Lab</a>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",
        gap:14
      }}>
        {items.map(m => <ProductCard key={m.id} meta={m} />)}
      </div>
    </div>
  );
}
