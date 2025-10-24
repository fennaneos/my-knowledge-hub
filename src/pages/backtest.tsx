import React from 'react';
import Layout from '@theme/Layout';
import BacktestStudioTV from '../components/BacktestStudioTV';

export default function BacktestPage() {
  return (
    <Layout title="Backtest Studio" description="TradingView-style backtesting with signals, equity and metrics">
      <div style={{ padding: '16px' }}>
        <BacktestStudioTV />
      </div>
    </Layout>
  );
}
