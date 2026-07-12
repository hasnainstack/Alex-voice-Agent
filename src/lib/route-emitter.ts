import type { RouteInfo } from "@/types/call";

type Listener = (route: RouteInfo) => void;

// Module-level singleton — lives for the lifetime of the Node process.
// In dev with hot reload this resets, which is fine.
const listeners = new Set<Listener>();

export function emitRouteUpdate(route: RouteInfo): void {
  for (const fn of listeners) fn(route);
}

export function addRouteListener(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
