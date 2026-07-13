export const runtime = "nodejs";

import { getLatestRoute } from "@/lib/route-store";

export async function GET() {
  const route = getLatestRoute("latest");
  return Response.json(route ?? null);
}