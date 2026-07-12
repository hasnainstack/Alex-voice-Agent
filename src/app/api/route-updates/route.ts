export const runtime = "nodejs";

import { getLatestRoute } from "@/lib/route-store";

export async function GET(req: Request) {
  const callId = new URL(req.url).searchParams.get("callId") ?? "";
  const route = getLatestRoute(callId);
  return Response.json(route ?? null);
}
