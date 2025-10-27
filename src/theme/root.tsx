// src/theme/Root.tsx
import React from 'react';
import type { Props } from '@theme/Root';
import BrowserOnly from '@docusaurus/BrowserOnly';
import ConfettiProvider from '@site/src/components/ui/ConfettiProvider';

export default function Root({ children }: Props) {
  return (
    <>
      {children}
      {/* Mount celebration only on the client */}
      <BrowserOnly>
        {() => <ConfettiProvider>{null}</ConfettiProvider>}
      </BrowserOnly>
    </>
  );
}
