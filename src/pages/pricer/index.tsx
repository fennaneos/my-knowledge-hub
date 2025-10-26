import React from "react";
import ClientOnly from "../../components/ClientOnly";
import PricerHomeClient from "../../client/pricer/PricerHomeClient";

export default function PricerIndexPage() {
  return <ClientOnly fallback={<div style={{padding:24}}>Loading…</div>}><PricerHomeClient /></ClientOnly>;
}
