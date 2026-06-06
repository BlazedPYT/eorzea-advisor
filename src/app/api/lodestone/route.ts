import { NextResponse } from "next/server";
import {
  fetchGearSnapshot,
  findCharacterId,
  parseLodestoneId,
} from "@/lib/lodestone";

export const dynamic = "force-dynamic";

interface Body {
  url?: string;
  name?: string;
  world?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    let id: string | null = null;

    if (body.url) id = parseLodestoneId(body.url);
    if (!id && body.name && body.world) {
      id = await findCharacterId(body.name, body.world);
    }

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Couldn't find that character. Double-check the Lodestone URL, or the exact name + world — then try Manual Mode.",
        },
        { status: 404 }
      );
    }

    const snapshot = await fetchGearSnapshot(id);
    if (!snapshot || snapshot.items.length === 0) {
      return NextResponse.json(
        {
          error:
            "Found the character, but couldn't read gear (Lodestone may be private or rate-limited). Try Manual Mode.",
          id,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ...snapshot,
      warning:
        "Lodestone is a public snapshot and updates only when the character logs out — this gear may be hours or days old. Override anything that's stale.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "Lodestone sync failed. The site may be down or rate-limiting — please use Manual Mode.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
