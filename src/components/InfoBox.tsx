import React, { useState, useRef, useEffect } from "react";

/** Small golden (?) icon that opens an explanatory floating card on click */
export const InfoBox = ({
  title,
  content,
}: {
  title: string;
  content: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ display: "inline-block", position: "relative" }}>
      <span
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-block",
          marginLeft: 6,
          cursor: "pointer",
          background: "rgba(255,215,0,0.15)",
          color: "#ffd166",
          borderRadius: "50%",
          width: 18,
          height: 18,
          textAlign: "center",
          lineHeight: "18px",
          fontWeight: "bold",
          fontSize: 13,
          userSelect: "none",
          transition: "background 0.2s",
        }}
        title="Click for explanation"
      >
        ?
      </span>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "120%",
            left: 0,
            minWidth: 220,
            maxWidth: 300,
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(30,30,30,0.9)",
            color: "#ffeeba",
            border: "1px solid rgba(255,215,0,0.4)",
            boxShadow: "0 2px 8px rgba(255,215,0,0.25)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <strong style={{ color: "#ffd166" }}>{title}</strong>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>{content}</div>
        </div>
      )}
    </div>
  );
};
