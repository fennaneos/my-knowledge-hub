import React from 'react';
import OriginalRoot from '@theme-original/Root';
import type { Props } from '@theme/Root';
import { ProgressProvider } from '../components/progress/ProgressContext';
import RewardToaster from '../components/reward/RewardToaster';

export default function Root(props: Props): JSX.Element {
  return (
    <ProgressProvider>
      <OriginalRoot {...props} />
      <RewardToaster />
    </ProgressProvider>
  );
}
