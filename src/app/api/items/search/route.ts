import { NextResponse } from "next/server";
import { searchItems } from "@/lib/xivapi";

export const dynamic = "force-dynamic";

// Item search for the in-app Market Board, in-game style:
//   /api/items/search?q=ramie&category=33
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const category = Number(url.searchParams.get("category")) || undefined;
  if (q.trim().length < 2 && !category) return NextResponse.json({ items: [] });
  const items = await searchItems(q, { category });
  return NextResponse.json({ items });
}
