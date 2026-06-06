import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import type { CharacterProfile, GearSnapshotData } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Body {
  profile: CharacterProfile;
  gear?: GearSnapshotData;
}

// Return the saved profile (+ gear snapshot), if any.
export async function GET() {
  try {
    const data = await readStore();
    return NextResponse.json({ profile: data.profile, gear: data.gear });
  } catch (err) {
    return NextResponse.json(
      { profile: null, error: err instanceof Error ? err.message : "read error" },
      { status: 200 }
    );
  }
}

// Save the profile + optional gear snapshot.
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const p = body.profile;
  if (!p?.characterName || !p.job) {
    return NextResponse.json({ error: "Missing character name / job" }, { status: 400 });
  }

  try {
    const id = p.id ?? `local-${Date.now()}`;
    const profile = { ...p, id };
    await writeStore({ profile, gear: body.gear ?? null });
    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "write error" },
      { status: 500 }
    );
  }
}
