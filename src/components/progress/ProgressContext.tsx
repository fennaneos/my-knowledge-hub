import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type PackState = { ratio: number; weight: number }; // ratio 0..1, weight e.g. 1.5
type ChapterState = {
  packs: Record<string, PackState>;
  stars: number;           // total stars for chapter (0..3)
  ratio: number;           // normalized 0..1 (stars/3)
};

type ProgressMap = Record<string, ChapterState>;

type Ctx = {
  get: (id: string) => { stars: number; ratio: number } | undefined;
  clear: (id: string) => void;
  all: ProgressMap;
};

const ProgressContext = createContext<Ctx>({
  get: () => undefined,
  clear: () => {},
  all: {},
});

export function useProgress() {
  return useContext(ProgressContext);
}

const LS_KEY = 'lux:progress.v2'; // new key to avoid clashes with older structure

function readLS(): ProgressMap {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

function writeLS(obj: ProgressMap) {
  localStorage.setItem(LS_KEY, JSON.stringify(obj));
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function recomputeChapter(ch: ChapterState): ChapterState {
  // Sum weighted progress across packs; cap at 3★
  const stars = clamp(
    Object.values(ch.packs).reduce((acc, p) => acc + (p.weight || 0) * clamp(p.ratio || 0, 0, 1), 0),
    0,
    3
  );
  const ratio = stars / 3;
  return { ...ch, stars, ratio };
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<ProgressMap>(() => readLS());
  const mapRef = useRef(map);
  mapRef.current = map;

  const get = useCallback((id: string) => {
    const ch = mapRef.current[id];
    return ch ? { stars: ch.stars || 0, ratio: ch.ratio || 0 } : undefined;
  }, []);

  const clear = useCallback((id: string) => {
    const next = { ...mapRef.current };
    delete next[id];
    setMap(next);
    writeLS(next);
    document.dispatchEvent(
      new CustomEvent('lux:progress', { detail: { id, ratio: 0, stars: 0, from: 'context-clear' } })
    );
  }, []);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_KEY) return;
      setMap(readLS());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Listen to per-pack updates from TryIt
  useEffect(() => {
    const onPackProgress = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const chapterId = String(d.id || '');
      const packId = String(d.packId || '');
      const ratio = Number.isFinite(d.ratio) ? d.ratio : 0;
      const weight = Number.isFinite(d.weight) ? d.weight : 1.5; // default weight

      if (!chapterId || !packId) return;

      const prev = mapRef.current;
      const prevChapter: ChapterState = prev[chapterId] || { packs: {}, stars: 0, ratio: 0 };
      const newPacks: Record<string, PackState> = {
        ...prevChapter.packs,
        [packId]: { ratio: clamp(ratio, 0, 1), weight: weight > 0 ? weight : 1.5 },
      };
      const nextChapter = recomputeChapter({ ...prevChapter, packs: newPacks });
      const next: ProgressMap = { ...prev, [chapterId]: nextChapter };

      setMap(next);
      writeLS(next);

      // Emit normalized rollup for sidebar widgets
      document.dispatchEvent(
        new CustomEvent('lux:progress', {
          detail: { id: chapterId, ratio: nextChapter.ratio, stars: nextChapter.stars, from: 'context' },
        })
      );

      // If fully completed (3★), optionally show a small toast
      if (nextChapter.stars >= 3) {
        document.dispatchEvent(
          new CustomEvent('lux:reward', {
            detail: { type: 'chapter_complete', id: chapterId, label: 'Chapter Complete!', stars: 3 },
          })
        );
      }
    };

    document.addEventListener('lux:pack-progress', onPackProgress as EventListener);
    return () => document.removeEventListener('lux:pack-progress', onPackProgress as EventListener);
  }, []);

  const value = useMemo<Ctx>(() => ({ get, clear, all: map }), [get, clear, map]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
