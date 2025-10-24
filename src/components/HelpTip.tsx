import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Side = "top" | "right" | "bottom" | "left";

export default function HelpTip({
  title,
  children,
  side = "top",
}: {
  title: string | React.ReactNode;
  children: React.ReactNode;
  side?: Side;
}) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  // portal node
  const [mount, setMount] = useState<HTMLElement | null>(null);
  useEffect(() => setMount(document.body), []);

  // computed style for popover
  const popRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number; actualSide: Side }>({
    x: 0,
    y: 0,
    actualSide: side,
  });

  const compute = () => {
    if (!btnRef.current || !popRef.current) return;
    const b = btnRef.current.getBoundingClientRect();
    const p = popRef.current.getBoundingClientRect();

    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const candidates: Side[] =
      side === "top"
        ? ["top", "bottom", "right", "left"]
        : side === "bottom"
        ? ["bottom", "top", "right", "left"]
        : side === "right"
        ? ["right", "left", "top", "bottom"]
        : ["left", "right", "top", "bottom"];

    let best: { x: number; y: number; s: Side } | null = null;

    for (const s of candidates) {
      let x = 0,
        y = 0;
      if (s === "top") {
        x = b.left + b.width / 2 - p.width / 2;
        y = b.top - p.height - margin;
      } else if (s === "bottom") {
        x = b.left + b.width / 2 - p.width / 2;
        y = b.bottom + margin;
      } else if (s === "right") {
        x = b.right + margin;
        y = b.top + b.height / 2 - p.height / 2;
      } else {
        x = b.left - p.width - margin;
        y = b.top + b.height / 2 - p.height / 2;
      }

      // constrain to viewport (with a small 6px padding)
      const pad = 6;
      const cx = Math.min(Math.max(x, pad), vw - p.width - pad);
      const cy = Math.min(Math.max(y, pad), vh - p.height - pad);

      // check how much overflow would occur if we didn't clamp
      const overflow =
        (x < pad ? pad - x : 0) +
        (y < pad ? pad - y : 0) +
        (x + p.width > vw - pad ? x + p.width - (vw - pad) : 0) +
        (y + p.height > vh - pad ? y + p.height - (vh - pad) : 0);

      if (!best || overflow < 0.5) {
        best = { x: cx, y: cy, s };
        if (overflow <= 0) break;
      }
    }

    if (best) setPos({ x: best.x, y: best.y, actualSide: best.s });
  };

  // recompute when opened, on scroll/resize
  useLayoutEffect(() => {
    if (!open) return;
    compute();
    const onScroll = () => compute();
    const onResize = () => compute();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, side]);

  // close when clicking outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return;
      if (popRef.current && popRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <>
      <button
        ref={btnRef}
        className="helptip-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Help"
      >
        ?
      </button>

      {open && mount
        ? createPortal(
            <div
              ref={popRef}
              className={`helptip-pop modern ${pos.actualSide}`}
              style={{
                position: "fixed",
                left: Math.round(pos.x),
                top: Math.round(pos.y),
                zIndex: 10000,
              }}
            >
              <div className="helptip-title">{title}</div>
              <div className="helptip-body">{children}</div>
            </div>,
            mount
          )
        : null}
    </>
  );
}
