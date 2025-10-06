import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ProgressValue = { ratio: number; stars: number };
type ProgressMap = Record<string, ProgressValue>;

type Ctx = {
  get: (id: string) => ProgressValue | undefined;
  set: (id: string, value: ProgressValue) => void;
  all: ProgressMap;
};

const ProgressContext = createContext<Ctx>({
  get: () => undefined,
  set: () => {},
  all: {},
});

const LS_KEY = 'lux:progress';

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
  const set = useCallback((id: string, value: ProgressValue) => {
    const next: ProgressMap = { ...mapRef.current, [id]: value };
    setMap(next);
    writeLS(next);
    // notify any listeners (sidebar, etc.)
    document.dispatchEvent(new CustomEvent('lux:progress', { detail: { id, ...value } }));
  }, []);

  // sync when other tabs/windows update
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_KEY) return;
      setMap(readLS());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<Ctx>(() => ({ get, set, all: map }), [get, set, map]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  return useContext(ProgressContext);
}
