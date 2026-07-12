import type { RouteInfo } from "@/types/call";

const g = globalThis as unknown as { __routeStore?: Map<string, Partial<RouteInfo>> };
const store = g.__routeStore ?? new Map<string, Partial<RouteInfo>>();
g.__routeStore = store;

export function storeRoute(callId: string, patch: Partial<RouteInfo>) {
  const prev = store.get(callId) ?? {};
  store.set(callId, { ...prev, ...patch });
}

export function getLatestRoute(callId: string): Partial<RouteInfo> | null {
  return store.get(callId) ?? null;
}

export function clearRoute(callId: string) {
  store.delete(callId);
}
