export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { broadcastRouteUpdate } from "@/lib/sse-broadcast";
import type { RouteInfo } from "@/types/call";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "";

function verifyBearer(authHeader: string | null): boolean {
  if (!WEBHOOK_SECRET) return true; // not configured — allow (dev only)
  if (!authHeader) return false;
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(WEBHOOK_SECRET)
    );
  } catch {
    return false; // length mismatch → not equal
  }
}

export async function POST(req: NextRequest) {
  if (!verifyBearer(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await req.text();
  const payload = JSON.parse(rawBody) as {
    message?: {
      call?: { id?: string };
      toolCallList?: Array<{
        id: string;
        function?: { name: string; arguments: unknown };
      }>;
    };
  };

  const toolCall = payload.message?.toolCallList?.[0];

  if (!toolCall || toolCall.function?.name !== "save_route") {
    return NextResponse.json({ error: "Unexpected tool call" }, { status: 400 });
  }

  const callId = payload.message?.call?.id ?? "";
  const rawArgs = toolCall.function.arguments;
  const args = (typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs) as Partial<RouteInfo>;

  broadcastRouteUpdate(callId, {
    departure: args.departure ?? null,
    arrival:   args.arrival   ?? null,
    date:      args.date      ?? null,
    service:   args.service   ?? null,
  });

  return NextResponse.json({
    results: [{ toolCallId: toolCall.id, result: `Saved: ${JSON.stringify(args)}` }],
  });
}
