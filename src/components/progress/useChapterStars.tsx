// src/progress/useChapterStars.ts
import { useEffect, useState } from 'react';
import { useProgress } from './ProgressContext';

type Out = { ratio: number; stars: number };

export default function useChapterStars(id?: string): Out {
  const { get } = useProgress();
  const initial = id ? get(id) : undefined;
  const [val, setVal] = useState<Out>({ ratio: initial?.ratio ?? 0, stars: initial?.stars ?? 0 });

  useEffect(() => {
    if (!id) return;

    // 1) Update immediately if context already has fresher data
    const v = get(id);
    if (v && (v.ratio !== val.ratio || v.stars !== val.stars)) {
      setVal({ ratio: v.ratio, stars: v.stars });
    }

    // 2) Subscribe to progress events (updates from TryIt/Context)
    const onProgress = (e: Event) => {
      const det = (e as CustomEvent).detail || {};
      if (det.id !== id) return;
      const ratio = Number(det.ratio ?? 0);
      const stars = Number(det.starsExact ?? det.stars ?? 0);
      setVal({ ratio, stars });
    };

    document.addEventListener('lux:progress', onProgress as EventListener);
    return () => document.removeEventListener('lux:progress', onProgress as EventListener);
  }, [id, get, val.ratio, val.stars]);

  return val;
}
