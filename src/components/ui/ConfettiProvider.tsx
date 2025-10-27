// src/components/ui/ConfettiProvider.tsx
import React from "react";
import ProgressCelebration from "./ProgressCelebration";

export default function ConfettiProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProgressCelebration />
    </>
  );
}
