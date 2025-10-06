import React, { useEffect, useRef, useState } from 'react';


export type TerminalPaneProps = {
onRun: (input: string) => Promise<string> | string;
placeholder?: string;
height?: number;
};


export default function TerminalPane({ onRun, placeholder = 'type a command...', height = 320 }: TerminalPaneProps) {
const [lines, setLines] = useState<string[]>(["lux-term v1.0 — type 'help' to begin\n"]);
const [input, setInput] = useState('');
const scroller = useRef<HTMLDivElement>(null);


useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight }); }, [lines]);


async function submit() {
const cmd = input.trim();
if (!cmd) return;
setLines(l => [...l, `❯ ${cmd}`]);
setInput('');
try {
const out = await onRun(cmd);
setLines(l => [...l, String(out ?? '')]);
} catch (e: any) {
setLines(l => [...l, `error: ${e?.message || e}`]);
}
}


return (
<div style={{
background: '#0b0b0b', border: '1px solid var(--gold-faint)', borderRadius: 12,
boxShadow: 'var(--lux-shadow)', display: 'flex', flexDirection: 'column',
height
}}>
<div ref={scroller} style={{ flex: 1, overflow: 'auto', padding: '0.75rem 0.9rem', whiteSpace: 'pre-wrap', color: '#e6edf3', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 13 }}>
{lines.join('\n')}
</div>
<div style={{ display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,0.06)', padding: 10 }}>
<input
value={input}
onChange={(e) => setInput(e.target.value)}
onKeyDown={(e) => e.key === 'Enter' && submit()}
placeholder={placeholder}
style={{ flex: 1, background: '#0f1217', color: '#e6edf3', border: '1px solid var(--gold-faint)', borderRadius: 10, padding: '8px 10px' }}
/>
<button className="button button--primary" onClick={submit}>Run</button>
</div>
</div>
);
}