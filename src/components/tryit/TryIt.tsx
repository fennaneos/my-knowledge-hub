// src/components/tryit/TryIt.tsx
import React, { useMemo, useRef, useState } from 'react';
import PythonTerminalPane, {
  type PythonTerminalPaneHandle,
  type TestPack,
} from './PythonTerminalPane';

type UTest = { expr: string; expected?: number; tol?: number };

type UIPack = {
  id: string;
  name: string;
  detect?: string;
  question?: string;
  scaffold?: string;
  hint?: string;
  weight?: number; // supports fractional (e.g. 1.5)
  tests: { expr: string; expected?: number; tol?: number }[];
};

type TryItProps = {
  id?: string;
  title?: string;
  intro?: string;
  chapterId?: string;

  // legacy one-pack
  scaffold?: string;
  testName?: string;
  tests?: UTest[];

  // multi-pack
  packs?: UIPack[];
  packWeight?: number;

  hideLegacyTiles?: boolean;

  // cosmetic
  starTotal?: number; // total stars for the chapter (defaults to sum(weights) or 3)
};

/* -----------------------------
   Progress helpers (monotonic)
------------------------------ */
const STAR_KEY = (chapterId: string) => `stars:${chapterId}`;
function writeStarsMonotonic(chapterId: string, earned: number, total: number) {
  const key = STAR_KEY(chapterId);
  try {
    const prevRaw = localStorage.getItem(key);
    const prev = prevRaw ? JSON.parse(prevRaw) : null;
    const next = {
      chapterId,
      earned: Math.max(prev?.earned ?? 0, earned),
      total: Math.max(prev?.total ?? 0, total),
      updatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(next));
    // Broadcast so ChapterStars updates immediately
    try {
      window.dispatchEvent(new CustomEvent('tryit:progress', { detail: next }));
    } catch {}
  } catch {}
}

export default function TryIt({
  id = 'tryit',
  title = 'Practice',
  intro = 'Complete the functions below, then run the tests.',
  chapterId,

  scaffold,
  testName,
  tests,

  packs,
  packWeight = 1.5,
  hideLegacyTiles = false,

  starTotal,
}: TryItProps) {
  const termRef = useRef<PythonTerminalPaneHandle>(null);

  /** ============ Legacy scaffold (used only if packs not provided) ============ */
  const legacyScaffold = useMemo(
    () =>
      scaffold ||
      [
        'import math',
        '',
        'def compute_forward(S, r, q, T):',
        '    """Return forward F = S * exp((r - q) * T)."""',
        '    # TODO',
        '    return 0',
        '',
      ].join('\n'),
    [scaffold]
  );

  const legacyForwardPack: TestPack = useMemo(() => {
    if (tests && tests.length) {
      return { name: testName || 'Tests', tests: tests.map(t => ({ ...t })) };
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

  const legacyIndexPack: TestPack = useMemo(
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

  /** ================= Progress dispatch & accounting ================= */
  const pendingPackIdsRef = useRef<string[]>([]);
  const packWeightsRef = useRef<Record<string, number>>({});
  const passedPacksRef = useRef<Record<string, boolean>>({});

  const handlePackDone = (summary: { name: string; total: number; passed: number }) => {
    if (!chapterId) return;
    const packId = pendingPackIdsRef.current.shift() || 'pack';
    const ratio = summary.total > 0 ? (summary.passed || 0) / summary.total : 0;
    const w = (summary as any).weight ?? packWeight;

    // Original bus (if other widgets listen to it)
    document.dispatchEvent(
      new CustomEvent('lux:pack-progress', {
        detail: { id: chapterId, packId, ratio, weight: w, from: 'tryit' },
      })
    );

    // Award stars only on FULL pass for this pack
    if (ratio === 1) {
      passedPacksRef.current[packId] = true;

      // Ensure we know this pack's weight
      if (!(packId in packWeightsRef.current)) packWeightsRef.current[packId] = w;

      const ids = Object.keys(packWeightsRef.current);
      const totalFromWeights = ids.reduce((acc, id) => acc + (packWeightsRef.current[id] || 0), 0);
      const totalStars = typeof starTotal === 'number' ? starTotal : (totalFromWeights || 3);

      const earned = ids.reduce(
        (acc, id) => acc + (passedPacksRef.current[id] ? (packWeightsRef.current[id] || 0) : 0),
        0
      );

      writeStarsMonotonic(chapterId, earned, totalStars);
    } else {
      // Still notify listeners to refresh if they depend on partials
      try {
        window.dispatchEvent(
          new CustomEvent('tryit:progress', {
            detail: { chapterId, earned: 0, total: typeof starTotal === 'number' ? starTotal : 3 },
          })
        );
      } catch {}
    }
  };

  /** ================= Multi-pack UI (tiles) ================= */
  const [activeTile, setActiveTile] = useState<string | null>(packs?.[0]?.id ?? null);
  const [openHintId, setOpenHintId] = useState<string | null>(null);

  const onInsertScaffold = (p: UIPack) => {
    const api = termRef.current;
    if (!api || !p.scaffold) return;
    setActiveTile(p.id);
    api.insertCode(p.scaffold);
  };

  const onToggleHint = (id: string) => setOpenHintId(prev => (prev === id ? null : id));

  /** ================= Visible Questions ================= */
  const questionItems = useMemo(() => {
    if (!packs || !packs.length) return [];
    return packs.map((p, idx) => ({
      key: p.id || String(idx),
      title: p.name,
      text: (p.question || '').trim(),
    }));
  }, [packs]);

  /** ================= Run tests ================= */
  const runTests = () => {
    const api = termRef.current;
    if (!api) return;
    api.switchToTests?.();

    pendingPackIdsRef.current = [];

    if (packs && packs.length) {
      const code = api.getCode();
      const toRun: { ui: UIPack; pack: TestPack }[] = [];

      for (const ui of packs) {
        let match = true;
        if (ui.detect) {
          try {
            const re = new RegExp(ui.detect);
            match = re.test(code);
          } catch {
            match = true;
          }
        }
        if (match) {
          toRun.push({
            ui,
            pack: { name: ui.name, tests: ui.tests.map(t => ({ ...t })) },
          });
        }
      }

      const finalList =
        toRun.length > 0
          ? toRun
          : [{ ui: packs[0], pack: { name: packs[0].name, tests: packs[0].tests.map(t => ({ ...t })) } }];

      for (const item of finalList) {
        pendingPackIdsRef.current.push(item.ui.id);
        const w = item.ui.weight ?? packWeight;
        packWeightsRef.current[item.ui.id] = w;
        (api as any).__tryit_currentWeight = w;
        api.runTests(item.pack as TestPack);
      }
      return;
    }

    // Legacy
    const code = api.getCode();
    const hasForward = /def\s+compute_forward\s*\(/.test(code);
    const hasIndex = /def\s+compute_index_forward\s*\(/.test(code);

    if (tests && tests.length) {
      pendingPackIdsRef.current.push('custom');
      packWeightsRef.current['custom'] = packWeight;
      (api as any).__tryit_currentWeight = packWeight;
      api.runTests(legacyForwardPack);
      return;
    }

    if (hasForward) {
      pendingPackIdsRef.current.push('forward');
      packWeightsRef.current['forward'] = packWeight;
      (api as any).__tryit_currentWeight = packWeight;
      api.runTests(legacyForwardPack);
    }
    if (hasIndex) {
      pendingPackIdsRef.current.push('index');
      packWeightsRef.current['index'] = packWeight;
      (api as any).__tryit_currentWeight = packWeight;
      api.runTests(legacyIndexPack);
    }
    if (!hasForward && !hasIndex) {
      pendingPackIdsRef.current.push('forward');
      packWeightsRef.current['forward'] = packWeight;
      (api as any).__tryit_currentWeight = packWeight;
      api.runTests(legacyForwardPack);
    }
  };

  /** Hook our weight into onTestsDone summary */
  const onTestsDone = (summary: { name: string; total: number; passed: number }) => {
    const w = (termRef.current as any)?.__tryit_currentWeight;
    (summary as any).weight = w ?? packWeight;
    handlePackDone(summary);
  };

  /** ================= Render ================= */
  return (
    <div id={`tryit-${id}`} style={{ margin: '1rem 0' }}>
      <div className="gold-glow" style={{ padding: 12, border: '1px solid var(--gold-faint)', borderRadius: 12 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <p style={{ marginTop: 6, color: '#cfcfcf' }}>{intro}</p>
      </div>

      {packs && packs.length ? (
        <div
          className="gold-glow"
          style={{
            marginTop: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
            border: '1px solid var(--gold-faint)',
            borderRadius: 12,
            padding: 12,
          }}
        >
          {packs.map(p => (
            <div
              key={p.id}
              style={{
                border: '1px solid rgba(212,175,55,0.28)',
                borderRadius: 14,
                padding: 14,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
                boxShadow: activeTile === p.id ? '0 0 .8rem rgba(255,215,0,.18)' : undefined,
              }}
            >
              <h4 style={{ margin: '0 0 6px 0' }}>{p.name}</h4>
              <div className="tryit-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {p.scaffold && (
                  <button className="button button--primary" onClick={() => onInsertScaffold(p)}>
                    Insert scaffold
                  </button>
                )}
                {p.hint && (
                  <button className="button" onClick={() => setOpenHintId(prev => (prev === p.id ? null : p.id))}>
                    {openHintId === p.id ? 'Hide hint' : 'Hint'}
                  </button>
                )}
              </div>
              {p.hint && openHintId === p.id && (
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
                  <code>{p.hint}</code>
                </pre>
              )}
            </div>
          ))}
        </div>
      ) : !hideLegacyTiles ? (
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
          <div
            style={{
              border: '1px solid rgba(212,175,55,0.28)',
              borderRadius: 14,
              padding: 14,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
            }}
          >
            <h4 style={{ marginTop: 0, marginBottom: 6 }}>⭐ Define one-asset forward</h4>
            <div className="tryit-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="button button--primary"
                onClick={() => termRef.current?.insertCode(legacyScaffold)}
              >
                Insert scaffold
              </button>
            </div>
          </div>

          <div
            style={{
              border: '1px solid rgba(212,175,55,0.28)',
              borderRadius: 14,
              padding: 14,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
            }}
          >
            <h4 style={{ marginTop: 0, marginBottom: 6 }}>⭐ Define index forward (vector)</h4>
            <div className="tryit-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="button button--primary"
                onClick={() =>
                  termRef.current?.insertCode(
                    [
                      'import math',
                      '',
                      'def compute_index_forward(weights, spots, r, q_vec, T):',
                      '    """Return Σ w_i * S_i * exp((r - q_i) * T)."""',
                      '    # TODO',
                      '    return 0',
                      '',
                    ].join('\n')
                  )
                }
              >
                Insert scaffold
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ height: 16 }} />
      <PythonTerminalPane
        ref={termRef}
        height={560}
        autoFocus
        initialCode={packs?.[0]?.scaffold ?? legacyScaffold}
        onTestsDone={onTestsDone}
      />

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <button
          className="button button--success"
          onClick={runTests}
          title="Run tests for the function(s) you’ve defined"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <span style={{ fontWeight: 800 }}>▶</span> Run tests
        </button>
      </div>
    </div>
  );
}
