import { NextResponse } from "next/server";
import { getZones } from "@/lib/bestiary";

export const revalidate = 86400;

export async function GET() {
  try {
    return NextResponse.json({ zones: await getZones() });
  } catch {
    return NextResponse.json({ zones: [] });
  }
}
