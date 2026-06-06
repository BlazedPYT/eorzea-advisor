import { NextResponse } from "next/server";
import { searchCharacters } from "@/lib/lodestone";

export const dynamic = "force-dynamic";

// Type-ahead character search: GET /api/lodestone/search?name=Aria&world=Gilgamesh
export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") ?? "";
  const world = url.searchParams.get("world") ?? undefined;
  if (name.trim().length < 2) return NextResponse.json({ matches: [] });
  try {
    const matches = await searchCharacters(name, world);
    return NextResponse.json({ matches });
  } catch {
    return NextResponse.json({ matches: [] });
  }
}
