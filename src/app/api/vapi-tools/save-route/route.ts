import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { emitRouteUpdate } from "@/lib/route-emitter";
import type { RouteInfo } from "@/types/call";

const VAPI_WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET ?? "";

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !VAPI_WEBHOOK_SECRET) return !VAPI_WEBHOOK_SECRET; // skip if no secret configured
  const expected = crypto
    .createHmac("sha256", VAPI_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-vapi-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    message?: {
      toolCalls?: Array<{
        id: string;
        function?: { name: string; arguments: unknown };
      }>;
    };
  };

  const toolCall = payload.message?.toolCalls?.[0];

  if (!toolCall || toolCall.function?.name !== "save_route") {
    return NextResponse.json({ error: "Unexpected tool call" }, { status: 400 });
  }

  const args = toolCall.function.arguments as Partial<RouteInfo>;

  // Broadcast to any listening SSE clients (the frontend)
  emitRouteUpdate({
    departure: args.departure ?? null,
    arrival:   args.arrival   ?? null,
    date:      args.date      ?? null,
    service:   args.service   ?? null,
  });

  // Optional: persist to DB here
  // await db.leads.upsert({ callId: payload.message.call.id, ...args });

  return NextResponse.json({
    results: [{ toolCallId: toolCall.id, result: `Saved: ${JSON.stringify(args)}` }],
  });
}
