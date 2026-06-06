import { NextResponse } from "next/server";
import { getWorldNames } from "@/lib/universalis";

export const revalidate = 86400;

export async function GET() {
  const worlds = await getWorldNames();
  return NextResponse.json({ worlds });
}
