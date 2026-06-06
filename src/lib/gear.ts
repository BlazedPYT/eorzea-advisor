import type {
  CharacterProfile,
  GearItem,
  GearRecommendation,
  GearSlot,
  PriceInfo,
  RecLabel,
} from "./types";
import { getJob } from "./jobs";
import { bracketForLevel } from "./brackets";
import type { ResolvedItem } from "./xivapi";

// ---------------------------------------------------------------------------
// Dynamic gear advisor (pure logic). Given a profile + resolved game items +
// market prices, produce a per-slot recommendation. Works for ANY job & level
// because the slot/role/level → item resolution is data-driven.
// ---------------------------------------------------------------------------

export const ALL_SLOTS: GearSlot[] = [
  "Weapon",
  "Head",
  "Body",
  "Hands",
  "Legs",
  "Feet",
  "Earrings",
  "Necklace",
  "Bracelet",
  "Ring1",
  "Ring2",
];

export const SLOT_LABEL: Record<GearSlot, string> = {
  Weapon: "Weapon",
  Head: "Head",
  Body: "Body",
  Hands: "Hands",
  Legs: "Legs",
  Feet: "Feet",
  Earrings: "Earrings",
  Necklace: "Necklace",
  Bracelet: "Bracelet",
  Ring1: "Ring I",
  Ring2: "Ring II",
};

export const SLOT_EMOJI: Record<GearSlot, string> = {
  Weapon: "⚔️",
  Head: "🪖",
  Body: "🥋",
  Hands: "🧤",
  Legs: "👖",
  Feet: "🥾",
  Earrings: "💠",
  Necklace: "📿",
  Bracelet: "⌚",
  Ring1: "💍",
  Ring2: "💍",
};

const ARMOR_ACC_SLOTS: GearSlot[] = ALL_SLOTS.filter((s) => s !== "Weapon");

function weaponRec(profile: CharacterProfile): GearRecommendation {
  const b = bracketForLevel(profile.level);
  const job = getJob(profile.job);
  if (b.strategy === "POETICS_CAP") {
    return {
      slot: "Weapon",
      recommendedName: `${b.poeticsSet} weapon (or job-quest weapon)`,
      marketSearch: `${b.poeticsSet} ${job.name} weapon`,
      hqMatters: false,
      label: "USE_POETICS",
      reason: `At ${b.min} your strongest cheap weapon comes from Tomestones of Poetics or your latest job quest — don't pay gil for one.`,
    };
  }
  if (b.strategy === "ENDGAME") {
    return {
      slot: "Weapon",
      recommendedName: "Tomestone / raid / crafted weapon",
      marketSearch: `${job.name} weapon`,
      hqMatters: true,
      label: "WORTH_IT",
      reason:
        "At max level your weapon is the single biggest upgrade. Get it from current Tomestones, normal raid, or a crafted weapon — weapon iLvl matters most.",
    };
  }
  return {
    slot: "Weapon",
    recommendedName: "Job-quest / dungeon weapon",
    marketSearch: `${job.name} weapon`,
    hqMatters: true,
    label: "DUNGEON_DROP",
    reason:
      "While leveling, your job quests and dungeon drops hand you weapons for free. Only buy one off the MB if you're badly behind — it gets replaced fast.",
  };
}

function poeticsArmorRec(
  slot: GearSlot,
  setName: string,
  level: number
): GearRecommendation {
  return {
    slot,
    recommendedName: `${setName} ${SLOT_LABEL[slot]}`,
    marketSearch: `${setName}`,
    hqMatters: false,
    label: "USE_POETICS",
    expectedItemLevel: undefined,
    reason: `Buy the ${setName} ${SLOT_LABEL[
      slot
    ].toLowerCase()} with Tomestones of Poetics from Rowena's reps. It's free of gil and beats most Market Board gear at level ${level}.`,
  };
}

function resolvedArmorRec(
  slot: GearSlot,
  resolved: ResolvedItem | undefined,
  profile: CharacterProfile
): GearRecommendation {
  const b = bracketForLevel(profile.level);
  const job = getJob(profile.job);
  const hqMatters = b.strategy !== "VENDOR_DUNGEON";

  if (!resolved) {
    // Fall back to honest conceptual advice when nothing resolves.
    return {
      slot,
      recommendedName: `Best ${job.suffix} ${SLOT_LABEL[slot].toLowerCase()} near your level`,
      marketSearch: `${SLOT_LABEL[slot]} of ${job.suffix}`,
      hqMatters,
      label: b.strategy === "VENDOR_DUNGEON" ? "DUNGEON_DROP" : "LATER",
      reason:
        b.strategy === "VENDOR_DUNGEON"
          ? "Use whatever drops in your current dungeon — don't spend gil this early."
          : "Couldn't pin an exact item — search the Market Board for your slot + role suffix, or just take the dungeon drop.",
    };
  }

  const name = resolved.name;
  if (b.strategy === "VENDOR_DUNGEON") {
    return {
      slot,
      recommendedName: name,
      marketSearch: name,
      hqMatters: false,
      expectedItemLevel: resolved.levelEquip,
      label: "DUNGEON_DROP",
      reason: `${name} works, but at level ${profile.level} the matching dungeon drop is free. Only buy if it's a few gil.`,
    };
  }

  if (b.strategy === "ENDGAME") {
    return {
      slot,
      recommendedName: `${name} (HQ)`,
      marketSearch: `${name} HQ`,
      hqMatters: true,
      expectedItemLevel: resolved.levelEquip,
      label: "WORTH_IT",
      reason: `${name} is a solid HQ crafted piece for entering endgame. Replace later with Tomestone/raid gear as you grind.`,
    };
  }

  // MARKET_DUNGEON leveling brackets
  return {
    slot,
    recommendedName: `${name} (HQ)`,
    marketSearch: `${name} HQ`,
    hqMatters: true,
    expectedItemLevel: resolved.levelEquip,
    label: "BUY",
    reason: `${name} is a cheap HQ leveling upgrade for this slot. HQ gives a small bonus but the real win is just keeping current — you'll replace it in a few levels.`,
  };
}

/** Build base recommendations (no prices yet). */
export function buildGearRecommendations(
  profile: CharacterProfile,
  equipped: GearItem[],
  resolved: Partial<Record<GearSlot, ResolvedItem>>
): GearRecommendation[] {
  const b = bracketForLevel(profile.level);
  const equippedBySlot = new Map(equipped.map((g) => [g.slot, g]));

  const recs: GearRecommendation[] = [weaponRec(profile)];

  for (const slot of ARMOR_ACC_SLOTS) {
    let rec: GearRecommendation;
    if (b.strategy === "POETICS_CAP" && b.poeticsSet) {
      rec = poeticsArmorRec(slot, b.poeticsSet, profile.level);
    } else {
      rec = resolvedArmorRec(slot, resolved[slot], profile);
    }
    rec.equipped = equippedBySlot.get(slot);
    recs.push(rec);
  }
  return recs;
}

/**
 * Adjust a recommendation's label based on live price vs. the player's gil and
 * the value of the slot at their bracket. This is where the goblin-tax /
 * too-expensive / worth-it judgement happens.
 */
export function applyPriceJudgement(
  rec: GearRecommendation,
  price: PriceInfo | undefined,
  profile: CharacterProfile
): GearRecommendation {
  if (!price || price.error) return { ...rec, price };
  // Tomestone-based recs ignore MB price entirely.
  if (rec.label === "USE_POETICS") return { ...rec, price };

  const cheap = rec.hqMatters
    ? price.cheapestHq ?? price.cheapest
    : price.cheapest ?? price.cheapestHq;
  if (!cheap) return { ...rec, price };

  const b = bracketForLevel(profile.level);
  const leveling =
    b.strategy === "MARKET_DUNGEON" || b.strategy === "VENDOR_DUNGEON";

  let label: RecLabel = rec.label;
  let extra = "";

  if (cheap > profile.gil && profile.gil > 0) {
    label = "TOO_EXPENSIVE";
    extra = ` That's ${cheap.toLocaleString()} gil — more than you have right now.`;
  } else if (leveling && cheap > 40000) {
    label = "GOBLIN_TAX";
    extra = ` ${cheap.toLocaleString()} gil for leveling gear is a goblin tax. Take the dungeon drop instead.`;
  } else if (leveling && cheap > 12000) {
    label = "REPLACE_SOON";
    extra = ` At ${cheap.toLocaleString()} gil it's okay, but you'll out-level it soon.`;
  } else if (cheap <= 3000) {
    label = "WORTH_IT";
    extra = ` Only ${cheap.toLocaleString()} gil — basically free, grab it.`;
  } else if (!leveling && cheap > 2_000_000) {
    label = "LUXURY";
    extra = ` ${cheap.toLocaleString()} gil is a flex — fine if you're rich.`;
  } else {
    label = "BUY";
    extra = ` ~${cheap.toLocaleString()} gil — fair price.`;
  }

  return { ...rec, price, label, reason: rec.reason + extra };
}
