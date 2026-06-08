// ---------------------------------------------------------------------------
// Player experience tier — *how seasoned the player is*, separate from the
// character's in-game level. A level-90 newbie and a veteran on a fresh alt
// are very different people; this lets the app meet each where they are.
//
// The character level sets a sensible default tier, but the player can always
// override it (CharacterProfile.experience). Higher tiers get terser, denser
// guidance and unlock the Endgame section; lower tiers get more hand-holding.
// ---------------------------------------------------------------------------

import type { ExperienceTier } from "./types";
export type { ExperienceTier };

export interface TierMeta {
  id: ExperienceTier;
  label: string;
  emoji: string;
  /** One friendly line describing who this tier is for. */
  blurb: string;
  /** Lower tiers get more explanatory text; higher tiers get terser output. */
  handHolding: boolean;
}

export const EXPERIENCE_TIERS: TierMeta[] = [
  {
    id: "BEGINNER",
    label: "Beginner",
    emoji: "🌱",
    blurb: "New to FFXIV — extra explanations, gentle pacing, no jargon.",
    handHolding: true,
  },
  {
    id: "INTERMEDIATE",
    label: "Intermediate",
    emoji: "🌿",
    blurb: "Knows the basics — helpful tips, but less hand-holding.",
    handHolding: true,
  },
  {
    id: "EXPERIENCED",
    label: "Experienced",
    emoji: "⚔️",
    blurb: "Comfortable with the game — concise, to-the-point advice.",
    handHolding: false,
  },
  {
    id: "VETERAN",
    label: "Veteran",
    emoji: "🛡️",
    blurb: "Seen it all — terse output, assumes you know the systems.",
    handHolding: false,
  },
  {
    id: "ENDGAME",
    label: "Endgame (100+)",
    emoji: "🔥",
    blurb: "Raids, savage, relics, hunts — opens the Endgame section.",
    handHolding: false,
  },
];

const TIER_BY_ID: Record<ExperienceTier, TierMeta> = Object.fromEntries(
  EXPERIENCE_TIERS.map((t) => [t.id, t])
) as Record<ExperienceTier, TierMeta>;

const TIER_ORDER: ExperienceTier[] = EXPERIENCE_TIERS.map((t) => t.id);

/** The tier a given character level defaults to (the user can override it). */
export function defaultExperienceForLevel(level: number): ExperienceTier {
  if (level <= 30) return "BEGINNER";
  if (level <= 70) return "INTERMEDIATE";
  if (level <= 99) return "EXPERIENCED";
  return "VETERAN"; // 100 caps at Veteran; Endgame is an opt-in override
}

/** The effective tier for a profile: explicit override, else level-derived. */
export function resolveExperience(p: {
  level: number;
  experience?: ExperienceTier;
}): ExperienceTier {
  return p.experience ?? defaultExperienceForLevel(p.level);
}

export function tierMeta(tier: ExperienceTier): TierMeta {
  return TIER_BY_ID[tier];
}

/** Whether to show the chattier, explanatory UI (blurbs, quick questions). */
export function showHandHolding(tier: ExperienceTier): boolean {
  return TIER_BY_ID[tier].handHolding;
}

/** Is this player focused on max-level endgame content? */
export function isEndgameTier(tier: ExperienceTier): boolean {
  return tier === "VETERAN" || tier === "ENDGAME";
}

/** Numeric rank (0 = Beginner … 4 = Endgame) for comparisons. */
export function tierRank(tier: ExperienceTier): number {
  return TIER_ORDER.indexOf(tier);
}
