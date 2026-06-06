import { NextResponse } from "next/server";
import { getEntry } from "@/lib/bestiary";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!key) return NextResponse.json({ error: "missing key" }, { status: 400 });
  try {
    const entry = await getEntry(key);
    if (!entry) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ entry });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "entry failed" },
      { status: 500 }
    );
  }
}
