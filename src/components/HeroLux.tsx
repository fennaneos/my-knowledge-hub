import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  eyebrow?: string; // small label above title
  children?: React.ReactNode; // optional CTA buttons etc.
};

export default function HeroLux({
  title,
  subtitle,
  align = "left",
  eyebrow,
  children,
}: Props) {
  return (
    <section
      style={{
        padding: "56px 28px 32px",
        background: "linear-gradient(180deg, rgba(255,215,0,0.06) 0%, rgba(0,0,0,0) 70%)",
        borderBottom: "1px solid rgba(212,175,55,0.25)",
        boxShadow: "0 0 0.6rem rgba(255,215,0,.10), 0 0 2.2rem rgba(255,215,0,.06)",
        borderRadius: "14px",
      }}
      className="hero-lux"
    >
      {eyebrow && (
        <div
          style={{
            color: "#ffd700",
            fontSize: 14,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.9,
            marginBottom: 10,
          }}
        >
          {eyebrow}
        </div>
      )}

      <h1
        style={{
          margin: 0,
          lineHeight: 1.1,
          textAlign: align,
          fontSize: "clamp(28px, 5vw, 44px)",
          fontWeight: 800,
          background: "linear-gradient(90deg, #d4af37, #ffd700)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {title}
      </h1>

      {subtitle && (
        <p
          style={{
            marginTop: 12,
            color: "#e6e6e6",
            textAlign: align,
            fontSize: "clamp(14px, 2.2vw, 18px)",
            maxWidth: 900,
            opacity: 0.9,
          }}
        >
          {subtitle}
        </p>
      )}

      <div
        style={{
          marginTop: 18,
          display: "flex",
          gap: 12,
          justifyContent: align === "center" ? "center" : "flex-start",
          flexWrap: "wrap",
        }}
      >
        {children}
      </div>

      {/* Gold divider */}
      <div
        style={{
          height: 1,
          marginTop: 24,
          background:
            "linear-gradient(90deg, transparent, rgba(212,175,55,0.35), transparent)",
        }}
      />
    </section>
  );
}
