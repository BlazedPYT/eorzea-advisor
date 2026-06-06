import type { CharacterProfile, GearItem, GearSnapshotData } from "./types";

// ---------------------------------------------------------------------------
// Demo / mock seed profile. This is ONLY example data — the app works for any
// job and level. (Spec's flagship example: Scholar 54, 70M gil, story-skipped.)
// ---------------------------------------------------------------------------

export const DEMO_PROFILE: CharacterProfile = {
  characterName: "Aria Lumenfield",
  world: "Gilgamesh",
  job: "SCH",
  level: 54,
  gil: 70_000_000,
  expansion: "Dawntrail",
  msqStatus: "SKIP_EW",
  storySkipped: true,
  goal: "SPEED_LEVELING",
  playstyle: "FASTEST",
  highestDungeon: "The Dead Ends (90)",
  avgItemLevel: 130,
};

// The exact Scholar-54 search list from the spec, used as a curated override so
// the flagship demo shows real Market Board prices for these precise items.
export const DEMO_SCH54_GEAR: { slot: GearItem["slot"]; marketSearch: string }[] = [
  { slot: "Weapon", marketSearch: "Dhalmelskin Codex HQ" },
  { slot: "Head", marketSearch: "Hardsilver Monocle of Healing HQ" },
  { slot: "Body", marketSearch: "Ramie Robe of Healing HQ" },
  { slot: "Hands", marketSearch: "Ramie Halfgloves of Healing HQ" },
  { slot: "Legs", marketSearch: "Ramie Tonban of Healing HQ" },
  { slot: "Feet", marketSearch: "Dhalmelskin Crakows of Healing HQ" },
  { slot: "Necklace", marketSearch: "Ramie Ribbon of Healing HQ" },
  { slot: "Earrings", marketSearch: "Hardsilver Earrings of Healing HQ" },
  { slot: "Bracelet", marketSearch: "Hardsilver Bangle of Healing HQ" },
  { slot: "Ring1", marketSearch: "Mormorion Ring of Healing HQ" },
  { slot: "Ring2", marketSearch: "Mormorion Ring of Healing HQ" },
];

// Example equipped snapshot (what a stale Lodestone pull might look like).
export const DEMO_GEAR_SNAPSHOT: GearSnapshotData = {
  source: "MANUAL",
  stale: false,
  fetchedAt: new Date().toISOString(),
  items: [
    { slot: "Weapon", name: "Direwolf Codex", itemLevel: 115, hq: false },
    { slot: "Head", name: "—", itemLevel: 0 },
    { slot: "Body", name: "Aurum Regis Coat of Healing", itemLevel: 120, hq: false },
    { slot: "Hands", name: "Ramie Halfgloves of Healing", itemLevel: 125, hq: false },
    { slot: "Legs", name: "Storm Private's Trousers", itemLevel: 100, hq: false },
    { slot: "Feet", name: "Dhalmelskin Crakows of Healing", itemLevel: 130, hq: true },
    { slot: "Earrings", name: "Mythrite Earrings of Healing", itemLevel: 100, hq: false },
    { slot: "Necklace", name: "—", itemLevel: 0 },
    { slot: "Bracelet", name: "Hardsilver Bangle of Healing", itemLevel: 125, hq: true },
    { slot: "Ring1", name: "Mythrite Ring of Healing", itemLevel: 100, hq: false },
    { slot: "Ring2", name: "—", itemLevel: 0 },
  ],
};

export function isDemoSch54(p: { job: string; level: number }): boolean {
  return p.job === "SCH" && p.level === 54;
}
