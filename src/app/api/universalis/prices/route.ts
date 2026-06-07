import { NextResponse } from "next/server";
import { priceItems } from "@/lib/universalis";

export const dynamic = "force-dynamic";

// Batch cheapest-price lookup for many item ids at once (for mount cards etc.):
//   /api/universalis/prices?world=Gilgamesh&ids=1,2,3
export async function GET(req: Request) {
  const url = new URL(req.url);
  const world = url.searchParams.get("world") ?? "Aether";
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 200);
  if (!ids.length) return NextResponse.json({ prices: {} });

  const map = await priceItems(world, ids);
  const prices: Record<number, { cheapest?: number; world?: string }> = {};
  for (const [id, info] of Object.entries(map)) {
    prices[Number(id)] = { cheapest: info.cheapest, world: info.worldName };
  }
  return NextResponse.json({ prices });
}
