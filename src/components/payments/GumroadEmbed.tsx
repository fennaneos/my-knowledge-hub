import React from "react";

interface GumroadEmbedProps {
  href: string;             // your Gumroad product URL
  label: string;            // button text
  className?: string;
}

export default function GumroadEmbed({ href, label, className = "" }: GumroadEmbedProps) {
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Centered popup
    const w = 720, h = 840;
    const left = window.screenX + (window.innerWidth - w) / 2;
    const top  = window.screenY + (window.innerHeight - h) / 2;

    // Open popup; if blocked, fall back to same-tab navigation
    const win = window.open(
      `${href}${href.includes("?") ? "&" : "?"}embedded=true`,
      "gumroad_popup",
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    if (!win) window.location.href = href; // fallback if popup blocked
  };

  return (
    <button type="button" onClick={onClick} className={`btn-neutral ${className}`}>
      {label}
    </button>
  );
}
