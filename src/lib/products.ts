// src/lib/products.ts
export type ProductCategory = "Equity" | "FX" | "Rates" | "Credit" | "Multi-Asset";
export type ProductId =
  | "vanilla"
  | "autocall"
  | "barrier"
  | "basket"
  | "quanto"
  | "irs"
  | "capfloor"
  | "cds";

export type ProductMeta = {
  id: ProductId;
  title: string;
  teaser: string;
  category: ProductCategory;
  defaultSymbol: string;     // what to preview on the card
  docsHref?: string;
  pricerHref: string;        // your /pricer routes
  simulateHref?: string;     // /lab or custom
  badge?: string;
};

export const PRODUCTS: ProductMeta[] = [
// in src/lib/products.ts (where you define cards)
{ id:'vanilla', title:'Vanilla Option (BS)', category:'Equity', defaultSymbol:'AAPL',
  teaser:'Calls/Puts, Greeks, IV.', pricerHref:'/pricer/Vanilla', docsHref:'/finance/vanilla', simulateHref:'/lab' }
,
  {
    id: "autocall",
    title: "Autocallable / Phoenix",
    teaser: "KO levels, coupons, paths.",
    category: "Equity",
    defaultSymbol: "EU50",
    pricerHref: "/pricer/Autocallable",
    docsHref: "/finance/autocallable",
  },
  {
    id: "barrier",
    title: "Barrier Option",
    teaser: "Up/Down, In/Out, MC.",
    category: "Equity",
    defaultSymbol: "SPY",
    pricerHref: "/pricer/Barrier",
  },
  {
    id: "basket",
    title: "Basket Option",
    teaser: "Correlated underlyings.",
    category: "Multi-Asset",
    defaultSymbol: "AAPL,MSFT,NVDA",
    pricerHref: "/pricer/Basket",
  },
  {
    id: "quanto",
    title: "Quanto Option",
    teaser: "FX-hedged payoff.",
    category: "FX",
    defaultSymbol: "EURUSD",
    pricerHref: "/pricer/Quanto",
  },
  {
    id: "irs",
    title: "IRS / Swap",
    teaser: "Fixed–float pricing.",
    category: "Rates",
    defaultSymbol: "USD-SOFR",
    pricerHref: "/pricer/Swap",
  },
  {
    id: "capfloor",
    title: "Cap / Floor",
    teaser: "IR vol surface.",
    category: "Rates",
    defaultSymbol: "EUR-EURIBOR",
    pricerHref: "/pricer/CapFloor",
  },
  {
    id: "cds",
    title: "Credit Default Swap",
    teaser: "Hazard-rate model.",
    category: "Credit",
    defaultSymbol: "CDX-IG",
    pricerHref: "/pricer/CDS",
  },
];

export const CATEGORIES: ProductCategory[] = ["Equity", "FX", "Rates", "Credit", "Multi-Asset"];
