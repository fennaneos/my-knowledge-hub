// src/components/tryit/PurchaseGate.tsx
import React, { useState } from 'react';
import { useEntitlements } from './useEntitlements';

export function PurchaseGate({
  sku,
  gumroadUrl,       // e.g. "https://asraelx.gumroad.com/l/pythoncookbook"
  productId,         // Gumroad product_id (not permalink!) for license verification
  children,
}: {
  sku?: string;
  gumroadUrl: string;
  productId: string;
  children: React.ReactNode;
}) {
  const ent = useEntitlements();
  const [license, setLicense] = useState('');
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (ent.has(sku)) return <>{children}</>;

  async function verify() {
    setChecking(true); setErr(null);
    try {
      // Call your server (avoid CORS by not calling Gumroad from the browser)
      const res = await fetch('/api/gumroad/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, licenseKey: license }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'Verification failed');
      if (sku) ent.grant(sku);
    } catch (e:any) { setErr(e.message); }
    finally { setChecking(false); }
  }

  return (
    <div style={{ border: '1px solid var(--gold-faint)', borderRadius: 12, padding: '1rem' }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a className="button button--primary gumroad-button" href={gumroadUrl}>Unlock via Gumroad</a>
        <input
          placeholder="Paste your Gumroad license key"
          value={license}
          onChange={(e)=>setLicense(e.target.value)}
          style={{ flex: 1, background: '#0f1217', color: '#e6edf3', border: '1px solid var(--gold-faint)', borderRadius: 10, padding: '8px 10px' }}
        />
        <button className="button" disabled={!license || checking} onClick={verify}>
          {checking ? 'Verifying…' : 'Verify'}
        </button>
      </div>
      {err && <div className="alert alert--danger" style={{ marginTop: 8 }}>{err}</div>}
      <p style={{ color:'#cfcfcf', marginTop: 8 }}>After buying, your receipt shows the license key. Paste it here to unlock.</p>
    </div>
  );
}
