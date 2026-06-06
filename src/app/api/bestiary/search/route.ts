import { NextResponse } from "next/server";
import { searchBestiary } from "@/lib/bestiary";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) return NextResponse.json({ hits: [] });
  try {
    return NextResponse.json({ hits: await searchBestiary(q) });
  } catch (err) {
    return NextResponse.json(
      { hits: [], error: err instanceof Error ? err.message : "search failed" },
      { status: 200 }
    );
  }
}
