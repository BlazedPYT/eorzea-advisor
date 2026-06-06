import { NextResponse } from "next/server";
import { getTaxRates } from "@/lib/universalis";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const world = new URL(req.url).searchParams.get("world") ?? "Gilgamesh";
  const tax = await getTaxRates(world);
  if (!tax) return NextResponse.json({ error: "No tax data" }, { status: 502 });
  return NextResponse.json(tax);
}
