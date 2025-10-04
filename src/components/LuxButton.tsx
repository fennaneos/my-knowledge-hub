import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "ghost";
};

export default function LuxButton({ variant = "gold", ...props }: Props) {
  const base: React.CSSProperties = {
    borderRadius: 12,
    padding: "10px 16px",
    fontWeight: 700,
    letterSpacing: "0.3px",
    cursor: "pointer",
    border: "1px solid rgba(212,175,55,0.25)",
    boxShadow: "0 0 .5rem rgba(255,215,0,.10), 0 0 1.6rem rgba(255,215,0,.06)",
  };

  const gold =
    variant === "gold"
      ? {
          background: "linear-gradient(90deg, #d4af37, #ffd700)",
          color: "#111",
          border: "none",
        }
      : {
          background: "rgba(255,255,255,0.03)",
          color: "#eaeaea",
        };

  return (
    <button
      {...props}
      style={{
        ...base,
        ...gold,
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget.style.boxShadow =
          "0 0 .6rem rgba(255,215,0,.18), 0 0 2.2rem rgba(255,215,0,.10)"),
        (e.currentTarget.style.transform = "translateY(-1px)"))
      }
      onMouseLeave={(e) =>
        ((e.currentTarget.style.boxShadow =
          "0 0 .5rem rgba(255,215,0,.10), 0 0 1.6rem rgba(255,215,0,.06)"),
        (e.currentTarget.style.transform = "translateY(0)"))
      }
    />
  );
}
