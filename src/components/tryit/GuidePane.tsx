import React, { useState } from 'react';

export type GuideStep = {
  id: string;
  label: string;
  scaffold?: string;
  hint?: string;
};

export type GuidePaneProps = {
  title?: string;
  intro?: string;
  steps: GuideStep[];                // exactly your 4 steps
  onInsert?: (step: GuideStep) => void;
  activeId?: string | null;
};

export default function GuidePane({
  title = 'Exercises',
  intro = 'Fill the stubs, then run the tests below.',
  steps,
  onInsert,
  activeId,
}: GuidePaneProps) {
  const [openHint, setOpenHint] = useState<string | null>(null);

  return (
    <div className="gold-glow" style={{ border: '1px solid var(--gold-faint)', borderRadius: 12, padding: 14 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {intro && <p style={{ marginTop: 6, color: '#cfcfcf' }}>{intro}</p>}

      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0 0', display: 'grid', gap: 8 }}>
        {steps.map(step => {
          const active = step.id === activeId;
          return (
            <li
              key={step.id}
              className="gold-glow"
              style={{
                border: '1px solid var(--gold-faint)',
                borderRadius: 10,
                padding: '10px 12px',
                background: active ? 'rgba(255,215,0,0.06)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontWeight: 700 }}>
                  {step.label}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {step.hint && (
                    <button
                      className="button"
                      onClick={() => setOpenHint(h => (h === step.id ? null : step.id))}
                      title="Show hint"
                    >
                      Hint
                    </button>
                  )}
                  <button
                    className="button button--primary"
                    onClick={() => onInsert?.(step)}
                    title="Insert scaffold into editor"
                  >
                    Insert
                  </button>
                </div>
              </div>

              {openHint === step.id && step.hint && (
                <div
                  className="gold-glow"
                  style={{
                    marginTop: 8,
                    border: '1px solid var(--gold-faint)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    background: '#0f1217',
                  }}
                >
                  <div style={{ color: '#ffd700', fontWeight: 700, marginBottom: 4 }}>Hint</div>
                  {/* Render “hint” as code to get token colors (you can include Python-looking text) */}
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      color: '#e6edf3',
                      fontFamily:
                        'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
                      fontSize: 13,
                    }}
                  >
{step.hint}
                  </pre>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
