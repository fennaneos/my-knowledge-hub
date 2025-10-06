import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type PackState = { ratio: number; weight: number };
type ChapterState = {
  packs: Record<string, PackState>;
  stars: number;     // 0..3 (rounded to 0.5)
  ratio: number;     // 0..1  (stars/3)
};
type ProgressMap = Record<string, ChapterState>;

type Ctx = {
  get: (id: string) => ChapterState | undefined;
  set: (id: string, value: ChapterState) => void;
  clear: (id: string) => void;
  all: ProgressMap;
};

const ProgressContext = createContext<Ctx>({
  get: () => undefined,
  set: () => {},
  clear: () => {},
  all: {},
});

export function useProgress() {
  return useContext(ProgressContext);
}

const LS_KEY = 'lux:progress.v2';

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
function roundHalf(x: number) {
  return Math.round(x * 2) / 2;
}

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

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<ProgressMap>(() => readLS());
  const mapRef = useRef(map);
  mapRef.current = map;

  const get = useCallback((id: string) => mapRef.current[id], []);
  const set = useCallback((id: string, value: ChapterState) => {
    const next: ProgressMap = { ...mapRef.current, [id]: value };
    setMap(next);
    writeLS(next);
    // fire a lightweight event for sidebar shimmer (NOT consumed by this context)
    document.dispatchEvent(
      new CustomEvent('lux:progress', {
        detail: { id, ratio: value.ratio, stars: value.stars, from: 'context' },
      })
    );
  }, []);
  const clear = useCallback((id: string) => {
    const next: ProgressMap = { ...mapRef.current };
    delete next[id];
    setMap(next);
    writeLS(next);
    document.dispatchEvent(
      new CustomEvent('lux:progress', {
        detail: { id, ratio: 0, stars: 0, from: 'context' },
      })
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

  // ✅ Primary listener: per-pack progress
  useEffect(() => {
    const onPack = (e: Event) => {
      const { id, packId, ratio, weight } = (e as CustomEvent).detail || {};
      if (!id || !packId) return;

      const prev: ChapterState =
        mapRef.current[id] ?? { packs: {}, stars: 0, ratio: 0 };

      const packs: Record<string, PackState> = {
        ...prev.packs,
        [packId]: {
          ratio: clamp01(Number(ratio ?? 0)),
          weight: Number(weight ?? 0),
        },
      };

      // aggregate
      const starsExact = Object.values(packs).reduce(
        (sum, p) => sum + (p.weight || 0) * (p.ratio || 0),
        0
      );
      const stars = Math.min(3, roundHalf(starsExact));
      const chapterRatio = Math.min(1, starsExact / 3);

      set(id, { packs, stars, ratio: chapterRatio });
    };

    document.addEventListener('lux:pack-progress', onPack as EventListener);
    return () =>
      document.removeEventListener('lux:pack-progress', onPack as EventListener);
  }, [set]);

  const value = useMemo<Ctx>(
    () => ({ get, set, clear, all: map }),
    [get, set, clear, map]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
