import React, { useState, useRef, useEffect } from "react";

const TOP_SYMBOLS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "AMZN",
  "META",
  "GOOG",
  "NFLX",
  "AMD",
  "INTC",
];

interface SymbolDropdownProps {
  currentSymbol: string;
  onSelect: (symbol: string) => void;
}

export const SymbolDropdown: React.FC<SymbolDropdownProps> = ({
  currentSymbol,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        className="gold-btn"
        onClick={() => setOpen((o) => !o)}
        style={{
          background:
            "linear-gradient(135deg, #d4af37, #ffd166 70%, #ffb400)",
          border: "none",
          color: "#222",
          fontWeight: 600,
          borderRadius: 10,
          padding: "8px 16px",
          cursor: "pointer",
          boxShadow: "0 2px 10px rgba(255, 215, 0, 0.3)",
          transition: "all 0.3s ease",
        }}
      >
        Select Symbol ({currentSymbol}) ⏷
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            zIndex: 1000,
            background: "rgba(25, 25, 25, 0.95)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255, 215, 0, 0.3)",
            borderRadius: 8,
            padding: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          {TOP_SYMBOLS.map((sym) => (
            <div
              key={sym}
              onClick={() => {
                onSelect(sym);
                setOpen(false);
              }}
              style={{
                padding: "6px 10px",
                cursor: "pointer",
                borderRadius: 6,
                color: "#eee",
                fontWeight: 500,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255, 215, 0, 0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {sym}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
