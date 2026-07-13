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
  if (!WEBHOOK_SECRET) return true; // allow if not set
  if (!authHeader) return false;

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  // timingSafeEqual throws if buffer lengths differ
  if (token.length !== WEBHOOK_SECRET.length) return false;

  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(WEBHOOK_SECRET));
}

function safeJsonParse<T = any>(value: unknown): T | null {
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!verifyBearer(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const payload = await req.json();

  // Vapi tool-calls webhook shape
  const toolCall = payload?.message?.toolCallList?.[0];
  if (toolCall) {
    if (toolCall?.function?.name !== "save_route") {
      return NextResponse.json({ error: "Unexpected tool call" }, { status: 400, headers: CORS_HEADERS });
    }

    const args = safeJsonParse<Partial<RouteInfo>>(toolCall?.function?.arguments) ?? {};

    storeRoute("latest", {
      clientName: args.clientName ?? null,
      email: args.email ?? null,
      departure: args.departure ?? null,
      arrival: args.arrival ?? null,
      date: args.date ?? null,
      // service intentionally ignored
    });

    return NextResponse.json(
      { results: [{ toolCallId: toolCall.id, result: "ok" }] },
      { headers: CORS_HEADERS }
    );
  }

  // Dashboard "Test Tool" fallback (flat JSON body)
  const flat = payload as Partial<RouteInfo>;
  if (
    flat &&
    (typeof flat.clientName === "string" ||
      typeof flat.email === "string" ||
      typeof flat.departure === "string" ||
      typeof flat.arrival === "string" ||
      typeof flat.date === "string")
  ) {
    storeRoute("latest", {
      clientName: flat.clientName ?? null,
      email: flat.email ?? null,
      departure: flat.departure ?? null,
      arrival: flat.arrival ?? null,
      date: flat.date ?? null,
    });

    return NextResponse.json(
      { results: [{ toolCallId: "test", result: "ok" }] },
      { headers: CORS_HEADERS }
    );
  }

  return NextResponse.json({ error: "Unexpected payload" }, { status: 400, headers: CORS_HEADERS });
}