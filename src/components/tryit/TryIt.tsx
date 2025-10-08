// src/components/tryit/TryIt.tsx
import React, { useMemo, useRef, useState } from 'react';
import PythonTerminalPane, {
  type PythonTerminalPaneHandle,
  type TestPack,
} from './PythonTerminalPane';

type UTest = { expr: string; expected?: number; tol?: number };

// UI definition for a multi-exercise “pack”
type UIPack = {
  id: string;
  name: string;
  detect?: string;      // regex string to auto-run relevant pack(s)
  question?: string;    // VISIBLE description/question shown above the terminal
  scaffold?: string;    // starter code users can insert
  hint?: string;        // hint text
  weight?: number;      // per-pack star weight override
  tests: { expr: string; expected?: number; tol?: number }[];
};

type TryItProps = {
  id?: string;
  title?: string;
  intro?: string;
  chapterId?: string;

  // Back-compat (Actions–Indices legacy path):
  scaffold?: string;
  testName?: string;
  tests?: UTest[];

  // New multi-exercise API:
  packs?: UIPack[];
  packWeight?: number;     // default star weight when a pack has no explicit weight

  // Optional: keep for your old two-tile UX
  hideLegacyTiles?: boolean;

  // Cosmetic only
  starTotal?: number;
};

export default function TryIt({
  id = 'tryit',
  title = 'Practice',
  intro = 'Complete the functions below, then run the tests.',
  chapterId,

  // legacy
  scaffold,
  testName,
  tests,

  // new
  packs,
  packWeight = 1.5,
  hideLegacyTiles = false,

  // cosmetic
  starTotal,
}: TryItProps) {
  const termRef = useRef<PythonTerminalPaneHandle>(null);

  /** ================= Legacy scaffold (used only if packs not provided) ================ */
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

  /** ================= Progress dispatch ================= */
  const pendingPackIdsRef = useRef<string[]>([]);

  const handlePackDone = (summary: { name: string; total: number; passed: number }) => {
    if (!chapterId) return;
    const packId = pendingPackIdsRef.current.shift() || 'pack';
    const ratio = summary.total > 0 ? (summary.passed || 0) / summary.total : 0;

    document.dispatchEvent(
      new CustomEvent('lux:pack-progress', {
        detail: { id: chapterId, packId, ratio, weight: (summary as any).weight ?? packWeight, from: 'tryit' },
      })
    );
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

  /** ================= Visible Questions (from packs[].question) ================= */
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

    // New multi-exercise mode
    if (packs && packs.length) {
      const code = api.getCode();
      const toRun: { ui: UIPack; pack: TestPack }[] = [];

      // 1) Choose packs whose detect matches current code
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
            pack: {
              name: ui.name,
              tests: ui.tests.map(t => ({ ...t })),
            },
          });
        }
      }

      // 2) If none matched, run the first pack to give immediate feedback
      const finalList =
        toRun.length > 0
          ? toRun
          : [
              {
                ui: packs[0],
                pack: { name: packs[0].name, tests: packs[0].tests.map(t => ({ ...t })) },
              },
            ];

      // 3) Dispatch each pack; stash its weight so onTestsDone can forward it
      for (const item of finalList) {
        pendingPackIdsRef.current.push(item.ui.id);
        const w = item.ui.weight ?? packWeight;
        (api as any).__tryit_currentWeight = w;
        api.runTests(item.pack as TestPack);
      }
      return;
    }

    // Legacy (no packs): forward/index detection or custom tests
    const code = api.getCode();
    const hasForward = /def\s+compute_forward\s*\(/.test(code);
    const hasIndex = /def\s+compute_index_forward\s*\(/.test(code);

    if (tests && tests.length) {
      pendingPackIdsRef.current.push('custom');
      api.runTests(legacyForwardPack);
      return;
    }

    if (hasForward) {
      pendingPackIdsRef.current.push('forward');
      api.runTests(legacyForwardPack);
    }
    if (hasIndex) {
      pendingPackIdsRef.current.push('index');
      api.runTests(legacyIndexPack);
    }
    if (!hasForward && !hasIndex) {
      pendingPackIdsRef.current.push('forward');
      api.runTests(legacyForwardPack);
    }
  };

  /** ================= Hook our weight into onTestsDone summary ================= */
  const onTestsDone = (summary: { name: string; total: number; passed: number }) => {
    const w = (termRef.current as any)?.__tryit_currentWeight;
    (summary as any).weight = w ?? packWeight;
    handlePackDone(summary);
  };

  /** ================= Render ================= */
  return (
    <div id={`tryit-${id}`} style={{ margin: '1rem 0' }}>
      {/* Header */}
      <div className="gold-glow" style={{ padding: 12, border: '1px solid var(--gold-faint)', borderRadius: 12 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <p style={{ marginTop: 6, color: '#cfcfcf' }}>{intro}</p>
      </div>

      {/* Visible list of exercises/questions (from packs[].question) */}
      {questionItems.length > 0 && (
        <div
          className="gold-glow"
          style={{
            marginTop: 12,
            border: '1px solid var(--gold-faint)',
            borderRadius: 12,
            padding: '12px 14px',
          }}
        >
          <h4 style={{ margin: '0 0 8px 0' }}>Exercises & Questions</h4>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#dcdcdc' }}>
            {questionItems.map((q) => (
              <li key={q.key} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, color: '#fff', marginBottom: 2 }}>{q.title}</div>
                {q.text ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {q.text}
                  </div>
                ) : (
                  <div style={{ opacity: 0.7 }}>No description provided.</div>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Tiles: multi-pack tiles or legacy two tiles */}
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
                  <button className="button" onClick={() => onToggleHint(p.id)}>
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
        // ===== Legacy two tiles (Forward/Index) =====
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

          {/* Index forward */}
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
