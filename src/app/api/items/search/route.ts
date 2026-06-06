import { NextResponse } from "next/server";
import { searchItems } from "@/lib/xivapi";

export const dynamic = "force-dynamic";

// Item name search for the in-app Market Board: /api/items/search?q=ramie
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) return NextResponse.json({ items: [] });
  const items = await searchItems(q);
  return NextResponse.json({ items });
}
