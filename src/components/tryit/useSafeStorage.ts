import { useEffect, useMemo, useRef } from 'react';


export function isBrowser() {
return typeof window !== 'undefined';
}


export function useSafeLocalStorage<T>(key: string, initial: T) {
const valueRef = useRef<T>(initial);


useEffect(() => {
if (!isBrowser()) return;
try {
const raw = window.localStorage.getItem(key);
if (raw != null) valueRef.current = JSON.parse(raw);
} catch {}
}, [key]);


const api = useMemo(() => ({
get: () => valueRef.current,
set: (v: T) => {
valueRef.current = v;
if (isBrowser())
window.localStorage.setItem(key, JSON.stringify(v));
},
patch: (p: Partial<T>) => {
const v = { ...(valueRef.current as any), ...p };
valueRef.current = v;
if (isBrowser())
window.localStorage.setItem(key, JSON.stringify(v));
}
}), [key]);


return api;
}