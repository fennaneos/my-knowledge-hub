// src/components/tryit/PythonTerminalPane.tsx
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

type PyOut = { text: string; value?: any };
export type TestCase = { expr: string; expected?: number | string; tol?: number };
export type TestPack = { name?: string; tests: TestCase[] };

export type PythonTerminalPaneProps = {
  height?: number;
  autoFocus?: boolean;
  initialCode?: string;
  onResult?: (result: PyOut) => void;
  onTestsDone?: (summary: { name: string; total: number; passed: number }) => void;
};

export type PythonTerminalPaneHandle = {
  insertCode: (code: string) => void;
  getCode: () => string;
  runCode: () => void;
  runTests: (pack: TestPack) => void;
  clearConsole: () => void;
  isReady: () => { editor: boolean; python: boolean };
};

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
const INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/';

type Line =
  | { kind: 'text'; text: string }
  | { kind: 'pass'; expr: string; got: string | number; expected: string | number; tol?: number }
  | { kind: 'fail'; expr: string; got: string | number; expected: string | number; tol?: number; error?: string }
  | { kind: 'headline'; text: string }
  | { kind: 'note'; text: string };

const PythonTerminalPane = forwardRef(function PythonTerminalPane(
  {
    height = 560,
    autoFocus = true,
    initialCode = '',
    onResult,
    onTestsDone,
  }: PythonTerminalPaneProps,
  ref: React.Ref<PythonTerminalPaneHandle>
) {
  /* ---------------- OUTPUT ---------------- */
  const [lines, setLines] = useState<Line[]>([
    { kind: 'text', text: 'lux-term — Python mode' },
    { kind: 'text', text: 'Ctrl/Cmd+Enter to Run' },
    { kind: 'text', text: '' },
  ]);
  const append = useCallback((l: Line | Line[]) => {
    setLines((prev) => prev.concat(Array.isArray(l) ? l : [l]));
  }, []);
  const resetConsole = useCallback(() => {
    setLines([
      { kind: 'text', text: 'lux-term — Python mode' },
      { kind: 'text', text: 'Ctrl/Cmd+Enter to Run' },
      { kind: 'text', text: '' },
    ]);
  }, []);

  /* ---------------- EDITOR (CodeMirror 6) ---------------- */
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [cmError, setCmError] = useState<string | null>(null);
  const pendingCodeRef = useRef<string | null>(initialCode || null);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { EditorState } = await import('@codemirror/state');
        const { EditorView, keymap, highlightActiveLine } = await import('@codemirror/view');
        const { defaultKeymap } = await import('@codemirror/commands');
        const { python } = await import('@codemirror/lang-python');
        const { defaultHighlightStyle, syntaxHighlighting } = await import('@codemirror/language');

        if (dead) return;

        const luxeTheme = EditorView.theme(
          {
            '&': { backgroundColor: '#0f1217', color: '#e6edf3' },
            '.cm-gutters': { backgroundColor: '#0f1217', color: '#8a8a8a', border: 'none' },
            '.cm-content': { caretColor: '#00c853' },
            '.cm-activeLine': { backgroundColor: 'rgba(0,200,83,0.08)' },
            '.cm-selectionBackground, .cm-content ::selection': { backgroundColor: '#2a2a2a' },
          },
          { dark: true }
        );

        const state = EditorState.create({
          doc: '',
          extensions: [
            python(),
            keymap.of([
              {
                key: 'Mod-Enter',
                run: () => {
                  runCode();
                  return true;
                },
              },
              ...defaultKeymap,
            ]),
            highlightActiveLine(),
            syntaxHighlighting(defaultHighlightStyle),
            luxeTheme,
            EditorView.lineWrapping,
          ],
        });

        const host = hostRef.current!;
        const view = new EditorView({ state, parent: host });
        viewRef.current = view;
        setEditorReady(true);

        if (pendingCodeRef.current != null) {
          const text = pendingCodeRef.current;
          pendingCodeRef.current = null;
          const { state: st } = view;
          view.dispatch({ changes: { from: 0, to: st.doc.length, insert: text } });
        }
        if (autoFocus) setTimeout(() => view.focus(), 0);
      } catch (e: any) {
        setCmError(e?.message || String(e));
      }
    })();
    return () => {
      dead = true;
      try {
        viewRef.current?.destroy?.();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCode = useCallback(() => (viewRef.current ? viewRef.current.state.doc.toString() : ''), []);
  const setCode = useCallback(
    (code: string) => {
      const view = viewRef.current;
      if (!view) {
        pendingCodeRef.current = code;
        append({ kind: 'note', text: '⌛ Editor not ready yet — scaffold will appear in a moment…' });
        return;
      }
      const { state } = view;
      view.dispatch({ changes: { from: 0, to: state.doc.length, insert: code } });
      view.focus();
    },
    [append]
  );

  /* ---------------- PYODIDE ---------------- */
  const pyRef = useRef<any>(null);
  const [pythonReady, setPythonReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if ((window as any).loadPyodide == null) {
        const s = document.createElement('script');
        s.src = PYODIDE_URL;
        s.defer = true;
        document.body.appendChild(s);
        await new Promise((res) => {
          s.onload = () => res(null);
        });
      }
      const loadPyodide = (window as any).loadPyodide;
      const py = await loadPyodide({ indexURL: INDEX_URL });
      if (cancelled) return;

      pyRef.current = py;
      await py.runPythonAsync(`
import math, sys, io, json

def _run_any(src):
    try:
        v = eval(compile(src, '<web>', 'eval'), globals())
        if v is not None:
            print(v)
        return v
    except SyntaxError:
        exec(compile(src, '<web>', 'exec'), globals())
        return None

def _eval_maybe_seq(src):
    try:
        return eval(compile(src, '<test>', 'eval'), globals())
    except SyntaxError:
        parts = [p.strip() for p in (src.replace('\\n',';')).split(';') if p.strip()]
        if not parts:
            return None
        if len(parts) == 1:
            exec(compile(parts[0], '<test>', 'exec'), globals())
            return None
        head, last = parts[:-1], parts[-1]
        if head:
            exec(compile(';'.join(head), '<test>', 'exec'), globals())
        try:
            return eval(compile(last, '<test>', 'eval'), globals())
        except SyntaxError:
            exec(compile(last, '<test>', 'exec'), globals())
            return None

def _run_tests(payload_json):
    try:
        p = json.loads(payload_json)
    except Exception as e:
        return json.dumps({"name":"tests","error":"bad JSON: "+str(e)})
    name = p.get("name","Tests")
    results = []
    for t in p.get("tests", []):
        expr = t.get("expr","")
        expected = t.get("expected", None)
        tol = float(t.get("tol", 1e-6))
        rec = {"expr": expr, "expected": expected, "tol": tol}
        try:
            v = _eval_maybe_seq(expr)
            rec["value"] = v
            if expected is None:
                rec["ok"] = True
            else:
                try:
                    ok = abs(float(v) - float(expected)) <= tol
                except Exception:
                    ok = (v == expected)
                rec["ok"] = bool(ok)
        except Exception as e:
            rec["error"] = str(e); rec["ok"] = False
        results.append(rec)
    return json.dumps({"name": name, "results": results})
`);
      setPythonReady(true);
      append({ kind: 'text', text: 'Python ready ✓' });

      if (initialCode && editorReady && !getCode()) setCode(initialCode);
    })();
    return () => {
      cancelled = true;
    };
  }, [append, editorReady, getCode, initialCode, setCode]);

  /* ---------------- EXEC HELPERS ---------------- */
  const runBlock = useCallback(
    async (block: string) => {
      const py = pyRef.current;
      if (!py) {
        append({ kind: 'note', text: '⚠️ Python not ready yet.' });
        return;
      }
      const trimmed = block.replace(/\s+$/, '');
      if (!trimmed) {
        append({ kind: 'note', text: '⚠️ Nothing to run.' });
        return;
      }

      append({ kind: 'headline', text: '▶ Running code' });
      append({ kind: 'text', text: trimmed });

      let buffer = '';
      const orig = py._module.print;
      py.setStdout({ batched: (s: string) => (buffer += s) });
      py.setStderr({ batched: (s: string) => (buffer += s) });

      try {
        const value = await py.runPythonAsync(`_run_any(${JSON.stringify(trimmed)})`);
        const out = buffer.trim();
        const text = (out.length ? out : value != null ? String(value) : 'ok').trim();
        append({ kind: 'text', text });
        onResult?.({ text, value });
      } catch (e: any) {
        append({ kind: 'fail', expr: 'execution', got: e?.message || String(e), expected: '', tol: 0 });
      } finally {
        py.setStdout({ batched: orig });
        py.setStderr({ batched: orig });
      }
    },
    [append, onResult]
  );

  const runCode = useCallback(() => {
    void runBlock(getCode());
  }, [getCode, runBlock]);

  const runTests = useCallback(
    async (pack: TestPack) => {
      const py = pyRef.current;
      if (!py) {
        append({ kind: 'note', text: '⚠️ Python not ready yet (tests skipped).' });
        return;
      }
      const payloadJson = JSON.stringify(pack || { tests: [] });

      append({ kind: 'headline', text: `▶ ${pack?.name || 'Tests'}` });

      let buffer = '';
      const orig = py._module.print;
      py.setStdout({ batched: (s: string) => (buffer += s) });
      py.setStderr({ batched: (s: string) => (buffer += s) });

      try {
        const resJson = await py.runPythonAsync(`_run_tests(${JSON.stringify(payloadJson)})`);
        const data = JSON.parse(String(resJson || '{}'));
        const results: any[] = Array.isArray(data?.results) ? data.results : [];

        const rows: Line[] = [];
        let passed = 0;
        for (const r of results) {
          const expr = r.expr;
          const got = Object.prototype.hasOwnProperty.call(r, 'value') ? r.value : '—';
          const exp = Object.prototype.hasOwnProperty.call(r, 'expected') ? r.expected : '—';
          const tol = r.tol ?? 0;
          if (r.ok) {
            rows.push({ kind: 'pass', expr, got, expected: exp, tol });
            passed++;
          } else {
            rows.push({ kind: 'fail', expr, got, expected: exp, tol, error: r.error });
          }
        }
        append(rows);

        onTestsDone?.({
          name: data?.name || 'Tests',
          total: results.length,
          passed,
        });
      } catch (err: any) {
        append({ kind: 'fail', expr: 'tests', got: err?.message || String(err), expected: '', tol: 0 });
      } finally {
        py.setStdout({ batched: orig });
        py.setStderr({ batched: orig });
      }
    },
    [append, onTestsDone]
  );

  /* ---------------- REF API ---------------- */
  useImperativeHandle(ref, () => ({
    insertCode: setCode,
    getCode,
    runCode,
    runTests,
    clearConsole: resetConsole,
    isReady: () => ({ editor: editorReady, python: pythonReady }),
  }));

  /* ---------------- RENDER ---------------- */
  return (
    <div
      className="gold-glow lux-shell"
      style={{
        border: '1px solid var(--gold-faint)',
        borderRadius: 12,
        boxShadow: 'var(--lux-shadow)',
        background: '#0b0b0b',
        height,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <style>{`
        .lux-shell .lux-header { border-bottom: 1px solid rgba(255,255,255,0.06); }
        .lux-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          flex: 1;
          min-height: 0;
        }
        .lux-pane { min-height: 0; overflow: hidden; }
        .lux-fill {
          height: 100%;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--gold-faint);
          border-radius: 10px;
          background: #0f1217;
        }
        .lux-editor-host,
        .lux-editor-host .cm-editor,
        .lux-editor-host .cm-scroller { height: 100%; }
        .lux-output-scroll {
          flex: 1;
          min-height: 0;
          overflow: auto;
          padding: 10px 12px;
          color: #e6edf3;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 13px;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
        .lux-out-line { white-space: pre-wrap; }
        .btn-success {
          background: #00c853;
          border-color: #00c853;
          color: #0b0b0b;
        }
        .btn-success:hover { filter: brightness(1.05); }
      `}</style>

      {/* Header */}
      <div
        className="lux-header"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}
      >
        <div style={{ color: '#eaeaea', fontWeight: 800, letterSpacing: 0.3 }}>
          Python Playground {pythonReady ? '· Ready' : '· Loading…'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="button" onClick={() => setCode(initialCode || '')}>
            Insert scaffold
          </button>
          <button className="button" onClick={resetConsole}>
            Clear console
          </button>
          <button className="button btn-success" onClick={runCode} title="Ctrl/Cmd+Enter">
            Run
          </button>
        </div>
      </div>

      {/* Split: Editor | Output */}
      <div className="lux-split">
        {/* Editor */}
        <div className="lux-pane" style={{ padding: 10, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="gold-glow lux-fill">
            <div ref={hostRef} className="lux-editor-host" />
          </div>
          {cmError && (
            <div className="alert alert--danger" style={{ marginTop: 8 }}>
              <strong>Editor failed to load.</strong>
              <div>{cmError}</div>
            </div>
          )}
        </div>

        {/* Output */}
        <div className="lux-pane" style={{ padding: 10 }}>
          <div className="gold-glow lux-fill">
            <div className="lux-output-scroll">
              {lines.map((l, i) => {
                if (l.kind === 'headline') {
                  return (
                    <div key={i} style={{ color: '#ffd700', fontWeight: 700, marginTop: 6 }} className="lux-out-line">
                      {l.text}
                    </div>
                  );
                }
                if (l.kind === 'note') {
                  return (
                    <div key={i} style={{ color: '#cfcfcf', fontStyle: 'italic' }} className="lux-out-line">
                      {l.text}
                    </div>
                  );
                }
                if (l.kind === 'pass') {
                  return (
                    <div key={i} className="lux-out-line" style={{ color: '#9cff95' }}>
                      ✅ PASS  {l.expr}
                      {'\n'}   got: {String(l.got)}
                      {'\n'}   expected: {String(l.expected)}
                      {typeof l.tol === 'number' ? ` (±${l.tol})` : ''}
                    </div>
                  );
                }
                if (l.kind === 'fail') {
                  return (
                    <div key={i} className="lux-out-line" style={{ color: '#ff8a8a' }}>
                      ❌ FAIL  {l.expr}
                      {l.error ? ` (error: ${l.error})` : ''}
                      {'\n'}   got: {String(l.got)}
                      {'\n'}   expected: {String(l.expected)}
                      {typeof l.tol === 'number' ? ` (±${l.tol})` : ''}
                    </div>
                  );
                }
                return (
                  <div key={i} className="lux-out-line">
                    {l.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}) as React.ForwardRefExoticComponent<
  PythonTerminalPaneProps & React.RefAttributes<PythonTerminalPaneHandle>
>;

export default PythonTerminalPane;
