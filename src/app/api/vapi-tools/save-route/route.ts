export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { storeRoute } from "@/lib/route-store";
import type { RouteInfo } from "@/types/call";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function verifyBearer(authHeader: string | null): boolean {
  if (!WEBHOOK_SECRET) return true;
  if (!authHeader) return false;
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(WEBHOOK_SECRET));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!verifyBearer(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const payload = await req.json() as {
    message?: {
      call?: { id?: string };
      toolCallList?: Array<{ id: string; function?: { name: string; arguments: unknown } }>;
    };
  };

  const toolCall = payload.message?.toolCallList?.[0];
  if (!toolCall || toolCall.function?.name !== "save_route") {
    return NextResponse.json({ error: "Unexpected tool call" }, { status: 400, headers: CORS_HEADERS });
  }

  const callId = "latest";
  const rawArgs = toolCall.function.arguments;
  const args = (typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs) as Partial<RouteInfo>;

  storeRoute(callId, {
    departure: args.departure ?? null,
    arrival:   args.arrival   ?? null,
    date:      args.date      ?? null,
    service:   args.service   ?? null,
  });

  return NextResponse.json(
    { results: [{ toolCallId: toolCall.id, result: `Saved: ${JSON.stringify(args)}` }] },
    { headers: CORS_HEADERS }
  );
}
