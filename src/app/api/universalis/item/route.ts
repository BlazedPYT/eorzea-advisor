import { NextResponse } from "next/server";
import { getItemDetail } from "@/lib/universalis";

export const dynamic = "force-dynamic";

// In-app Market Board detail: /api/universalis/item?id=10889&world=Gilgamesh
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  const world = url.searchParams.get("world") ?? "Aether";
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Bad item id" }, { status: 400 });
  }
  const detail = await getItemDetail(world, id);
  return NextResponse.json(detail);
}
