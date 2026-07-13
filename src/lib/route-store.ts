import type { RouteInfo } from "@/types/call";

const g = globalThis as unknown as { __routeStore?: Map<string, Partial<RouteInfo>> };
const store = g.__routeStore ?? new Map<string, Partial<RouteInfo>>();
g.__routeStore = store;

export function storeRoute(callId: string, patch: Partial<RouteInfo>) {
  const prev = store.get(callId) ?? {};
  // Only overwrite a field if the new value is non-null — never let a null
  // patch field erase a value that was already stored from an earlier call.
  const merged: Partial<RouteInfo> = { ...prev };
  for (const key of Object.keys(patch) as Array<keyof RouteInfo>) {
    const val = patch[key];
    if (val !== null && val !== undefined) {
      (merged as Record<string, unknown>)[key] = val;
    } else if (!(key in prev)) {
      (merged as Record<string, unknown>)[key] = null;
    }
  }
  store.set(callId, merged);
}

export function getLatestRoute(callId: string): Partial<RouteInfo> | null {
  return store.get(callId) ?? null;
}

export function clearRoute(callId: string) {
  store.delete(callId);
}
