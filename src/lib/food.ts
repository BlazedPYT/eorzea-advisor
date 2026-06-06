import type { FoodRec } from "./types";

// ---------------------------------------------------------------------------
// Food advisor. While leveling, the EXACT food stats barely matter — what
// matters is keeping the +3% EXP "Well Fed" buff active. So we recommend the
// cheapest, easiest food first.
// ---------------------------------------------------------------------------

export const CHEAP_LEVELING_FOOD: FoodRec[] = [
  {
    name: "Boiled Egg",
    marketSearch: "Boiled Egg",
    note: "Dirt cheap, often vendor-bought. Perfect EXP buff filler.",
  },
  {
    name: "Raisins / Sun-dried Raisins",
    marketSearch: "Sun-dried Raisins",
    note: "Tiny cost, long-ish duration. Great budget pick.",
  },
  {
    name: "Orange Juice",
    marketSearch: "Orange Juice",
    note: "Cheap drink, keeps the buff rolling between fights.",
  },
  {
    name: "Grade 1/2 cheap meals",
    marketSearch: "Pumpkin Potage",
    note: "Any low-level cooked meal on the MB works — buy whatever is cheapest.",
  },
];

export function foodAdvice(level: number): FoodRec[] {
  // Always recommend cheap food while leveling. At max level for hard content
  // you'd want the current BiS food, but that's a separate concern.
  if (level >= 100) {
    return [
      {
        name: "Current max-level food (only for hard content)",
        marketSearch: "Stuffed Highland Cabbage",
        note: "For Savage/Extreme only. For everyday play, the EXP buff is gone at 100 — eat whatever's cheap for the stats you want.",
      },
      ...CHEAP_LEVELING_FOOD.slice(0, 2),
    ];
  }
  return CHEAP_LEVELING_FOOD;
}
