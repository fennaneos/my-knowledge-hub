// src/pages/LabDashboard.tsx
import React from "react";
import Layout from "@theme/Layout";
import ClientOnly from "../components/ClientOnly";
import LabDashboardClient from "../client/pricer/LabDashboardClient";

export default function LabDashboardPage() {
  return (
    <Layout title="Lab Dashboard" description="Monte Carlo Lab with leaderboard">
      <ClientOnly fallback={<div style={{ padding: 24 }}>Loading…</div>}>
        <LabDashboardClient />
      </ClientOnly>
    </Layout>
  );
}
