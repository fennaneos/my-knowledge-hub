import React, { useMemo, useRef, useState } from 'react';
import PythonTerminalPane, {
  type PythonTerminalPaneHandle,
  type TestPack,
} from './PythonTerminalPane';

type TryItProps = {
  id?: string;
  title?: string;
  intro?: string;
  chapterId?: string; // Used for per-chapter star tracking
  paywall?: 'none' | 'gumroad';
  gumroadUrl?: string;
  gumroadProductId?: string;
  defaultOpen?: boolean;
  ctaLabel?: string;
  scaffold?: string;
  testName?: string;
  tests?: { expr: string; expected?: number; tol?: number }[];
};

export default function TryIt({
  id = 'forward-exercises',
  title = 'Forward Pricing Practice',
  intro = 'Define the functions below, then run the tests. PASS/FAIL and numeric outputs appear on the Tests tab.',
  chapterId,
  scaffold,
  testName,
  tests,
}: TryItProps) {
  const termRef = useRef<PythonTerminalPaneHandle>(null);

  /** ---------------- Default Scaffolds ---------------- */
  const scaffoldOne = useMemo(
    () =>
      scaffold ||
      [
        'import math',
        '',
        'def compute_forward(S, r, q, T):',
        '    """Return forward F = S * exp((r - q) * T)."""',
        '    # TODO: implement the correct formula',
        '    return 0',
        '',
      ].join('\n'),
    [scaffold]
  );

  const hintOne = useMemo(
    () =>
      [
        '💡 Hint (one-asset forward):',
        '',
        'F = S * exp((r - q) * T)',
        'Use math.exp, e.g.:',
        '',
        'import math',
        'def compute_forward(S, r, q, T):',
        '    return S * math.exp((r - q) * T)',
      ].join('\n'),
    []
  );

  const hintIdx = useMemo(
    () =>
      [
        '💡 Hint (index forward):',
        '',
        'F_index = Σ w_i * S_i * exp((r - q_i) * T)',
        'For example:',
        '',
        'import math',
        'def compute_index_forward(weights, spots, r, q_vec, T):',
        '    assert len(weights) == len(spots) == len(q_vec)',
        '    total = 0.0',
        '    for i in range(len(weights)):',
        '        total += weights[i] * spots[i] * math.exp((r - q_vec[i]) * T)',
        '    return total',
      ].join('\n'),
    []
  );

  /** ---------------- Test Packs ---------------- */
  const forwardPack: TestPack = useMemo(() => {
    if (tests && tests.length) {
      return { name: testName || 'Tests', tests: tests.map(t => ({ expr: t.expr, expected: t.expected, tol: t.tol })) };
    }
    return {
      name: 'Forward (one asset)',
      tests: [
        {
          expr: ['import math', 'S=100; r=0.02; q=0.03; T=1', 'compute_forward(S,r,q,T)'].join('; '),
          expected: Number((100 * Math.exp((0.02 - 0.03) * 1)).toFixed(6)),
          tol: 1e-3,
        },
        {
          expr: ['import math', 'S=250; r=0.01; q=0.00; T=2', 'compute_forward(S,r,q,T)'].join('; '),
          expected: Number((250 * Math.exp((0.01 - 0.0) * 2)).toFixed(6)),
          tol: 1e-3,
        },
      ],
    };
  }, [tests, testName]);

  const indexPack: TestPack = useMemo(
    () => ({
      name: 'Index forward',
      tests: [
        {
          expr: [
            'import math',
            'w=[0.5,0.3,0.2]; S=[100,50,80]; q=[0.03,0.02,0.04]; r=0.02; T=1',
            'compute_index_forward(w,S,r,q,T)',
          ].join('; '),
          expected: (() => {
            const w = [0.5, 0.3, 0.2];
            const S = [100, 50, 80];
            const q = [0.03, 0.02, 0.04];
            const r = 0.02;
            const T = 1;
            let acc = 0;
            for (let i = 0; i < w.length; i++) acc += w[i] * S[i] * Math.exp((r - q[i]) * T);
            return Number(acc.toFixed(6));
          })(),
          tol: 1e-3,
        },
        {
          expr: [
            'import math',
            'w=[0.4,0.6]; S=[120,80]; q=[0.015,0.025]; r=0.02; T=1.5',
            'compute_index_forward(w,S,r,q,T)',
          ].join('; '),
          expected: (() => {
            const w = [0.4, 0.6];
            const S = [120, 80];
            const q = [0.015, 0.025];
            const r = 0.02;
            const T = 1.5;
            let acc = 0;
            for (let i = 0; i < w.length; i++) acc += w[i] * S[i] * Math.exp((r - q[i]) * T);
            return Number(acc.toFixed(6));
          })(),
          tol: 1e-3,
        },
      ],
    }),
    []
  );

  /** ---------------- Per-pack → context (1.5★ each) ---------------- */
  const PACK_WEIGHT = 1.5;
  const pendingPackIdsRef = useRef<string[]>([]);

  const handlePackDone = (summary: { name: string; total: number; passed: number }) => {
    if (!chapterId) return;
    const packId = pendingPackIdsRef.current.shift() || 'forward';
    const ratio = summary.total > 0 ? (summary.passed || 0) / summary.total : 0;

    document.dispatchEvent(
      new CustomEvent('lux:pack-progress', {
        detail: { id: chapterId, packId, ratio, weight: PACK_WEIGHT, from: 'tryit' },
      })
    );
  };

  const [openOneHint, setOpenOneHint] = useState(false);
  const [openIdxHint, setOpenIdxHint] = useState(false);
  const [active, setActive] = useState<'one' | 'idx'>('one');

  const insertScaffold = (which: 'one' | 'idx') => {
    const api = termRef.current;
    if (!api) return;
    setActive(which);
    const code =
      which === 'one'
        ? [
            'import math',
            '',
            'def compute_forward(S, r, q, T):',
            '    """Return forward F = S * exp((r - q) * T)."""',
            '    # TODO: implement the correct formula',
            '    return 0',
            '',
          ].join('\n')
        : [
            'import math',
            '',
            'def compute_index_forward(weights, spots, r, q_vec, T):',
            '    """Return Σ w_i * S_i * exp((r - q_i) * T)."""',
            '    # TODO: loop over assets, sum weighted forwards',
            '    # Make sure all lists have the same length.',
            '    return 0',
            '',
          ].join('\n');
    api.insertCode(code);
  };

  const runRelevantTests = () => {
    const api = termRef.current;
    if (!api) return;
    api.switchToTests?.();

    const code = api.getCode();
    const hasForward = /def\s+compute_forward\s*\(/.test(code);
    const hasIndex = /def\s+compute_index_forward\s*\(/.test(code);

    pendingPackIdsRef.current = [];
    if (hasForward) {
      pendingPackIdsRef.current.push('forward');
      api.runTests(forwardPack);
    }
    if (hasIndex) {
      pendingPackIdsRef.current.push('index');
      api.runTests(indexPack);
    }
    if (!hasForward && !hasIndex) {
      pendingPackIdsRef.current.push('forward');
      api.runTests(forwardPack);
    }
  };

  /** ---------------- Render ---------------- */
  return (
    <div id={`tryit-${id}`} style={{ margin: '1rem 0' }}>
      {/* Header */}
      <div className="gold-glow" style={{ padding: 12, border: '1px solid var(--gold-faint)', borderRadius: 12 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <p style={{ marginTop: 6, color: '#cfcfcf' }}>{intro}</p>
      </div>

      {/* Tiles */}
      <div
        className="gold-glow"
        style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          border: '1px solid var(--gold-faint)',
          borderRadius: 12,
          padding: 12,
        }}
      >
        {/* One-asset forward */}
        <div
          style={{
            border: '1px solid rgba(212,175,55,0.28)',
            borderRadius: 14,
            padding: 14,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: 6 }}>
            {active === 'one' ? '⭐ Define one-asset forward' : 'Define one-asset forward'}
          </h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="button button--primary" onClick={() => insertScaffold('one')}>
              Insert scaffold
            </button>
            <button className="button" onClick={() => setOpenOneHint(v => !v)}>
              {openOneHint ? 'Hide hint' : 'Hint'}
            </button>
          </div>
          {openOneHint && (
            <pre
              className="gold-glow"
              style={{
                marginTop: 10,
                padding: '10px 12px',
                border: '1px solid var(--gold-faint)',
                borderRadius: 10,
                overflowX: 'auto',
                background: '#0f1217',
                color: '#e6edf3',
                fontSize: 13,
              }}
            >
              <code>{hintOne}</code>
            </pre>
          )}
        </div>

        {/* Index forward */}
        <div
          style={{
            border: '1px solid rgba(212,175,55,0.28)',
            borderRadius: 14,
            padding: 14,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: 6 }}>
            {active === 'idx' ? '⭐ Define index forward (vector)' : 'Define index forward (vector)'}
          </h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="button button--primary" onClick={() => insertScaffold('idx')}>
              Insert scaffold
            </button>
            <button className="button" onClick={() => setOpenIdxHint(v => !v)}>
              {openIdxHint ? 'Hide hint' : 'Hint'}
            </button>
          </div>
          {openIdxHint && (
            <pre
              className="gold-glow"
              style={{
                marginTop: 10,
                padding: '10px 12px',
                border: '1px solid var(--gold-faint)',
                borderRadius: 10,
                overflowX: 'auto',
                background: '#0f1217',
                color: '#e6edf3',
                fontSize: 13,
              }}
            >
              <code>{hintIdx}</code>
            </pre>
          )}
        </div>
      </div>

      <div style={{ height: 16 }} />
      <PythonTerminalPane ref={termRef} height={560} autoFocus initialCode={scaffoldOne} onTestsDone={handlePackDone} />

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <button
          className="button button--success"
          onClick={runRelevantTests}
          title="Run tests for the function(s) you’ve defined"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <span style={{ fontWeight: 800 }}>▶</span> Run tests
        </button>
      </div>
    </div>
  );
}
