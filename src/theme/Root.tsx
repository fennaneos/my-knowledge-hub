// src/theme/Root.tsx
import React from 'react';
import { ProgressProvider } from '@site/src/components/progress/ProgressContext';
import RewardToaster from '@site/src/components/reward/RewardToast';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider>
      {children}
      <RewardToaster />
    </ProgressProvider>
  );
}
