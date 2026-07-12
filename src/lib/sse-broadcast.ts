type Subscriber = {
  controller: ReadableStreamDefaultController;
  callId: string;
};

const globalForSSE = globalThis as unknown as {
  __routeSubscribers?: Set<Subscriber>;
};
const subscribers = globalForSSE.__routeSubscribers ?? new Set<Subscriber>();
globalForSSE.__routeSubscribers = subscribers;

export function broadcastRouteUpdate(callId: string, patch: Record<string, unknown>) {
  const encoder = new TextEncoder();
  const payload = `data: ${JSON.stringify({ ...patch, callId })}\n\n`;
  for (const sub of subscribers) {
    if (sub.callId !== callId) continue;
    try {
      sub.controller.enqueue(encoder.encode(payload));
    } catch {
      subscribers.delete(sub);
    }
  }
}

export function addSubscriber(callId: string, controller: ReadableStreamDefaultController) {
  const sub: Subscriber = { controller, callId };
  subscribers.add(sub);
  return () => subscribers.delete(sub);
}
