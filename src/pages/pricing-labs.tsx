import React from 'react';
import Layout from '@theme/Layout';
import LabPricing from './LabPricing';

export default function LabPricingPage() {
  return (
    <Layout title="AsraelX Lab Pricing" description="Plans for Lab access">
      <div style={{ padding: '16px' }}>
        <LabPricing />
      </div>
    </Layout>
  );
}
