// src/components/tryit/types.ts
export type TryItCommand = {
  id: string;
  label: string;
  /** Text inserted when user clicks Insert (fallback to `command` if omitted) */
  scaffold?: string;          // e.g. "def compute_forward(S,r,q,T):\n    return 0"
  /** Text shown when user clicks Hint */
  hint?: string;

  /** Fallback command (what shows in the terminal helper or runs when no scaffold) */
  command: string;

  // Existing validators
  expectedOutput?: string;
  regex?: string;
  expectedNumber?: number;
  tolerance?: number;

  /** Optional list of python snippets to run automatically (after Insert) */
  autorun?: string[];         // e.g. ["S=100; r=0.02; ...", "assert ...; print('OK')"]
};



export type TryItChallenge = {
id: string;
title: string;
description?: string;
commands: TryItCommand[];
successBadge?: {
id: string;
name: string;
emoji?: string; // e.g. "🏅"
color?: string; // fallback accent
}
};


// src/components/tryit/types.ts
export type TryItProps = {
  id: string;
  title?: string;
  sku?: string;                  // if present, gating can be enabled
  intro?: string;
  challenge: TryItChallenge;
  ctaLabel?: string;
  defaultOpen?: boolean;

  /** monetization */
  paywall?: 'none' | 'gumroad';  // default: 'gumroad' if sku provided
  gumroadUrl?: string;           // e.g. https://asraelx.gumroad.com/l/pythoncookbook
  gumroadProductId?: string;     // product_id used by Gumroad license verification
};
