import { NextResponse } from "next/server";
import { getSearchCategories } from "@/lib/xivapi";

export const revalidate = 86400;

export async function GET() {
  const categories = await getSearchCategories();
  return NextResponse.json({ categories });
}
