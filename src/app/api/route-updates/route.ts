export const runtime = "nodejs";
export const maxDuration = 60;

import { addSubscriber } from "@/lib/sse-broadcast";

export async function GET(req: Request) {
  const callId = new URL(req.url).searchParams.get("callId");
  if (!callId) return new Response("Missing callId", { status: 400 });

  let remove: () => void;
  const stream = new ReadableStream({
    start(controller) {
      remove = addSubscriber(callId, controller);
      controller.enqueue(new TextEncoder().encode(": connected\n\n"));
    },
    cancel() {
      remove?.();
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