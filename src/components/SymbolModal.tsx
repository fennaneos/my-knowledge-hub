import React, { useState, useEffect } from "react";

interface SymbolModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
}

interface SymbolResult {
  symbol: string;
  description: string;
  exchange: string;
}

export const SymbolModal: React.FC<SymbolModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SymbolResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const fetchSymbols = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://symbol-search.tradingview.com/symbol_search/?text=${encodeURIComponent(
            query
          )}&type=stock&exchange=NASDAQ`
        );
        const data = await res.json();
        setResults(data || []);
      } catch (e: any) {
        setError("Could not fetch symbols (CORS or offline).");
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchSymbols, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.25s ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(25,25,25,0.95)",
          border: "1px solid rgba(255,215,0,0.4)",
          borderRadius: 16,
          boxShadow: "0 0 25px rgba(255,215,0,0.2)",
          color: "#eee",
          width: 420,
          maxHeight: "70vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "popIn 0.25s ease",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid rgba(255,215,0,0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#ffd166", fontWeight: 700 }}>Select Symbol</div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#aaa",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 16 }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a symbol, e.g. AAPL..."
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #444",
              background: "#111",
              color: "#fff",
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
          {loading && <div style={{ opacity: 0.7 }}>Searching...</div>}
          {error && <div style={{ color: "orange" }}>{error}</div>}
          {!loading &&
            results.map((r) => (
              <div
                key={r.symbol}
                onClick={() => {
                  onSelect(r.symbol);
                  onClose();
                }}
                style={{
                  padding: "8px 10px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,215,0,0.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <strong style={{ color: "#ffd166" }}>{r.symbol}</strong>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {r.description} ({r.exchange})
                </div>
              </div>
            ))}
          {!loading && !results.length && query.length >= 2 && (
            <div style={{ opacity: 0.7 }}>No results found.</div>
          )}
        </div>
      </div>
    </div>
  );
};
