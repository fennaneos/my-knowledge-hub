import { useMemo } from 'react';
import { useSafeLocalStorage } from './useSafeStorage';


export type Badge = { id: string; name: string; emoji?: string; color?: string; date?: string };


export function useBadges() {
const store = useSafeLocalStorage<Record<string, Badge>>('lux:badges', {});


return useMemo(() => ({
all: () => Object.values(store.get() || {}),
award: (b: Badge) => store.patch({ [b.id]: { ...b, date: new Date().toISOString() } }),
has: (id: string) => !!store.get()?.[id]
}), [store]);
}