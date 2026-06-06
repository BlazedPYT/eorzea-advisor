// ---------------------------------------------------------------------------
// Core domain types for Eorzea Advisor
// ---------------------------------------------------------------------------

export type Role =
  | "TANK"
  | "HEALER"
  | "MELEE"
  | "PHYS_RANGED"
  | "MAGIC_RANGED"
  | "LIMITED";

export type GearSuffix =
  | "Fending"
  | "Healing"
  | "Striking"
  | "Maiming"
  | "Scouting"
  | "Aiming"
  | "Casting"
  | "—";

export interface JobDef {
  id: string; // "SCH"
  name: string; // "Scholar"
  baseClass?: string; // "Arcanist"
  role: Role;
  suffix: GearSuffix; // Market Board stat suffix, e.g. "of Healing"
  startingLevel: number; // level you can first play this job
  isLimited?: boolean;
  color: string; // accent color (job-ish)
  emoji: string;
}

export type GearSlot =
  | "Weapon"
  | "Head"
  | "Body"
  | "Hands"
  | "Legs"
  | "Feet"
  | "Earrings"
  | "Necklace"
  | "Bracelet"
  | "Ring1"
  | "Ring2";

export interface GearItem {
  slot: GearSlot;
  name: string;
  itemLevel?: number;
  hq?: boolean;
  icon?: string;
}

export type RecLabel =
  | "BUY"
  | "SKIP"
  | "LATER"
  | "REPLACE_SOON"
  | "GOBLIN_TAX"
  | "WORTH_IT"
  | "LUXURY"
  | "TOO_EXPENSIVE"
  | "USE_POETICS"
  | "DUNGEON_DROP";

export interface GearRecommendation {
  slot: GearSlot;
  equipped?: GearItem;
  recommendedName: string; // human display name
  marketSearch: string; // exact MB search string (includes HQ when relevant)
  hqMatters: boolean;
  expectedItemLevel?: number;
  label: RecLabel;
  reason: string;
  // Populated after a Universalis pricing pass
  price?: PriceInfo;
}

export interface PriceInfo {
  itemId?: number;
  cheapest?: number;
  cheapestHq?: number;
  averageNq?: number;
  averageHq?: number;
  lastUploadMs?: number;
  worldName?: string; // world of the cheapest listing (cross-world shopping)
  scope?: string; // what we queried (DC/world/region)
  salesPerDay?: number; // live sale velocity
  lastSalePrice?: number; // most recent sale
  lastSaleMs?: number;
  error?: string;
}

// Live Market Board retainer/counter tax per city (Universalis tax-rates).
export interface TaxRates {
  scope: string;
  rates: { city: string; rate: number }[];
  lowest?: { city: string; rate: number };
}

export type MsqStatus =
  | "NORMAL"
  | "SKIP_ARR"
  | "SKIP_HW"
  | "SKIP_SB"
  | "SKIP_SHB"
  | "SKIP_EW"
  | "IN_DAWNTRAIL"
  | "UNKNOWN";

export type Goal =
  | "SPEED_LEVELING"
  | "GEAR_UPGRADE"
  | "GLAMOUR"
  | "MOUNT_SHOPPING"
  | "GIL_SAVING"
  | "FRESH_RETURNER"
  | "WHAT_NEXT";

export type Playstyle =
  | "FASTEST"
  | "CASUAL"
  | "SAFE_PRACTICE"
  | "DPS_OPTIMIZE";

export interface CharacterProfile {
  id?: string;
  characterName: string;
  world: string;
  job: string; // job id
  level: number;
  gil: number;
  expansion: string;
  msqStatus: MsqStatus;
  storySkipped: boolean;
  goal: Goal;
  playstyle: Playstyle;
  highestDungeon?: string;
  weaponItemLevel?: number;
  avgItemLevel?: number;
  lodestoneId?: string;
  lodestoneUrl?: string;
}

export interface GearSnapshotData {
  source: "LODESTONE" | "MANUAL";
  stale: boolean;
  fetchedAt: string;
  items: GearItem[];
}

// A queue / duty recommendation
export interface QueueRec {
  title: string;
  detail: string;
  priority: "PRIMARY" | "SECONDARY" | "OPTIONAL";
  unlocked: boolean; // best-effort estimate
  icon: string;
}

// A leveling-route step
export interface RouteStep {
  level: number; // level you should be when you run it
  name: string;
  type: "DUNGEON" | "TRIAL" | "MILESTONE";
  note?: string;
  done?: boolean; // below current level
}

export interface FoodRec {
  name: string;
  marketSearch: string;
  note: string;
}

export interface GilWarning {
  title: string;
  detail: string;
  severity: "INFO" | "WARN" | "DANGER";
}

export interface LuxuryRec {
  title: string;
  detail: string;
  tag: "GLAM" | "MOUNT" | "FLEX";
}

// The full advisor output, computed from a profile (+ optional gear snapshot)
export interface AdvisorResult {
  role: Role;
  bracketLabel: string;
  estimatedItemLevel: number;
  whatNext: { headline: string; action: string; sub: string };
  gear: GearRecommendation[];
  queue: QueueRec[];
  route: RouteStep[];
  food: FoodRec[];
  gilWarnings: GilWarning[];
  luxury: LuxuryRec[];
  storyNote?: string;
}
