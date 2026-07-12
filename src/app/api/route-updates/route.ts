export const runtime = "nodejs";
export const maxDuration = 60; // see note below — SSE needs this raised

type Subscriber = {
  controller: ReadableStreamDefaultController;
  callId: string;
};

// Module-level store — persists across requests on the SAME warm
// serverless instance. See the multi-instance caveat below.
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

export async function GET(req: Request) {
  const callId = new URL(req.url).searchParams.get("callId");
  if (!callId) return new Response("Missing callId", { status: 400 });

  let sub: Subscriber;
  const stream = new ReadableStream({
    start(controller) {
      sub = { controller, callId };
      subscribers.add(sub);
      controller.enqueue(new TextEncoder().encode(": connected\n\n"));
    },
    cancel() {
      subscribers.delete(sub);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}