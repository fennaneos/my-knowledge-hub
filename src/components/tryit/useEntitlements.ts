import { useMemo } from 'react';
import { useSafeLocalStorage } from './useSafeStorage';


// Minimal entitlement store; replace with Stripe webhook/JWT later
export function useEntitlements() {
const store = useSafeLocalStorage<Record<string, boolean>>('lux:entitlements', {});


return useMemo(() => ({
has: (sku?: string) => !sku || !!store.get()?.[sku],
grant: (sku: string) => store.patch({ [sku]: true })
}), [store]);
}