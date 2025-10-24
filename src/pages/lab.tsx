import React from 'react';
import Layout from '@theme/Layout';
import LabDashboard from './LabDashboard'; // move your big component to src/components

import 'katex/dist/katex.min.css';


export default function LabPage() {
  return (
    <Layout title="AsraelX Lab" description="Monte Carlo sandbox, metrics, challenges">
      <div style={{ padding: '16px' }}>
        <LabDashboard />
      </div>
    </Layout>
  );
}
