import { NextResponse } from "next/server";
import { fetchNews } from "@/lib/lodestoneNews";

export const revalidate = 600;

export async function GET() {
  try {
    return NextResponse.json({ news: await fetchNews() });
  } catch {
    return NextResponse.json({ news: [] });
  }
}
