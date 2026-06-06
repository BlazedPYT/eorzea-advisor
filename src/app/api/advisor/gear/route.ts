import { NextResponse } from "next/server";
import type { CharacterProfile, GearItem, GearRecommendation, GearSlot } from "@/lib/types";
import { getJob } from "@/lib/jobs";
import {
  ALL_SLOTS,
  SLOT_LABEL,
  applyPriceJudgement,
  buildGearRecommendations,
} from "@/lib/gear";
import { resolveGearBySuffix, searchItemByName } from "@/lib/xivapi";
import { priceItems } from "@/lib/universalis";
import { DEMO_SCH54_GEAR, isDemoSch54 } from "@/lib/demo";

export const dynamic = "force-dynamic";

interface Body {
  profile: CharacterProfile;
  equipped?: GearItem[];
}

// Build the curated demo Scholar-54 recommendations (exact items from the spec).
async function buildDemoGear(
  profile: CharacterProfile,
  equipped: GearItem[]
): Promise<{ recs: GearRecommendation[]; slotToId: Partial<Record<GearSlot, number>> }> {
  const equippedBySlot = new Map(equipped.map((g) => [g.slot, g]));
  const slotToId: Partial<Record<GearSlot, number>> = {};

  const recs = await Promise.all(
    DEMO_SCH54_GEAR.map(async (entry): Promise<GearRecommendation> => {
      const resolved = await searchItemByName(entry.marketSearch);
      if (resolved) slotToId[entry.slot] = resolved.id;
      const isWeapon = entry.slot === "Weapon";
      return {
        slot: entry.slot,
        recommendedName: entry.marketSearch.replace(/\s+HQ$/i, ""),
        marketSearch: entry.marketSearch,
        hqMatters: true,
        expectedItemLevel: resolved?.levelEquip,
        label: "BUY",
        equipped: equippedBySlot.get(entry.slot),
        reason: isWeapon
          ? "Dhalmelskin Codex is the cheap HQ leveling book for Scholar at 54 — a big jump if your weapon is behind."
          : `${entry.marketSearch.replace(
              /\s+HQ$/i,
              ""
            )} is the recommended HQ piece for this slot at level 54.`,
      };
    })
  );
  return { recs, slotToId };
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { profile } = body;
  if (!profile?.job || !profile.level) {
    return NextResponse.json({ error: "Missing profile job/level" }, { status: 400 });
  }
  const equipped = body.equipped ?? [];
  const job = getJob(profile.job);

  // Blue Mage / limited jobs don't gear from the MB like normal jobs.
  if (job.isLimited) {
    return NextResponse.json({
      recommendations: ALL_SLOTS.map((slot) => ({
        slot,
        recommendedName: "Limited Job — no standard gear path",
        marketSearch: "",
        hqMatters: false,
        label: "SKIP",
        reason:
          "Blue Mage gears through its own progression (Carnivale / synced content), not the usual Market Board sets.",
      })),
      note: "Limited job: standard gear advice doesn't apply.",
    });
  }

  try {
    let recs: GearRecommendation[];
    let slotToId: Partial<Record<GearSlot, number>> = {};

    if (isDemoSch54(profile)) {
      const demo = await buildDemoGear(profile, equipped);
      recs = demo.recs;
      slotToId = demo.slotToId;
    } else {
      const resolved = await resolveGearBySuffix(job.suffix, profile.level);
      recs = buildGearRecommendations(profile, equipped, resolved);
      for (const slot of ALL_SLOTS) {
        const r = resolved[slot];
        if (r) slotToId[slot] = r.id;
      }
    }

    // One batched Universalis call for everything we resolved.
    const ids = Object.values(slotToId).filter(Boolean) as number[];
    const prices = ids.length ? await priceItems(profile.world || "Aether", ids) : {};

    const priced = recs.map((rec) => {
      const id = slotToId[rec.slot];
      const price = id ? prices[id] : undefined;
      return applyPriceJudgement(rec, price, profile);
    });

    return NextResponse.json({ recommendations: priced });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Gear advisor failed",
        detail: err instanceof Error ? err.message : String(err),
        // Still return slot scaffolding so the UI isn't empty.
        recommendations: ALL_SLOTS.map((slot) => ({
          slot,
          recommendedName: `Best ${job.suffix} ${SLOT_LABEL[slot].toLowerCase()}`,
          marketSearch: `${SLOT_LABEL[slot]} of ${job.suffix}`,
          hqMatters: true,
          label: "LATER" as const,
          reason: "Live data is unavailable right now — search the Market Board manually.",
        })),
      },
      { status: 200 }
    );
  }
}
