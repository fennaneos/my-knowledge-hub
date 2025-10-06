// src/theme/Root.tsx
import React from 'react';
import OriginalRoot from '@theme-original/Root';
import { ProgressProvider } from '@site/src/components/progress/ProgressContext';

export default function Root({ children }: { children?: React.ReactNode }) {
  return (
    <ProgressProvider>
      <OriginalRoot>{children}</OriginalRoot>
    </ProgressProvider>
  );
}
