// ---------------------------------------------------------------------------
// Level brackets + tomestone / Poetics catch-up guidance.
// This is the backbone of the dynamic gear advisor: every level maps to a
// bracket, and each bracket knows how a player should be gearing.
// ---------------------------------------------------------------------------

export interface Bracket {
  id: string;
  label: string;
  min: number;
  max: number;
  expansion: string;
  // Strategy hint for the gear advisor
  strategy: "VENDOR_DUNGEON" | "POETICS_CAP" | "MARKET_DUNGEON" | "ENDGAME";
  // For POETICS_CAP brackets: the named catch-up set you buy with tomestones
  poeticsSet?: string;
  poeticsItemLevel?: number;
  // Short description shown in UI
  blurb: string;
}

export const BRACKETS: Bracket[] = [
  {
    id: "arr-leveling",
    label: "1–49 · A Realm Reborn",
    min: 1,
    max: 49,
    expansion: "A Realm Reborn",
    strategy: "VENDOR_DUNGEON",
    blurb:
      "Spend almost nothing. Use vendor gear, class quest rewards and dungeon drops. Everything is replaced fast.",
  },
  {
    id: "lv50",
    label: "50 · Poetics Cap",
    min: 50,
    max: 50,
    expansion: "A Realm Reborn",
    strategy: "POETICS_CAP",
    poeticsSet: "Ironworks",
    poeticsItemLevel: 130,
    blurb:
      "Buy the Ironworks set with Allagan Tomestones of Poetics from Rowena's representatives. Cheap, strong, no gil needed.",
  },
  {
    id: "hw-leveling",
    label: "51–59 · Heavensward",
    min: 51,
    max: 59,
    expansion: "Heavensward",
    strategy: "MARKET_DUNGEON",
    blurb:
      "Crafted/Market Board ‘leveling’ gear every few levels, topped up by dungeon drops. Keep it cheap — you out-level it quickly.",
  },
  {
    id: "lv60",
    label: "60 · Poetics Cap",
    min: 60,
    max: 60,
    expansion: "Heavensward",
    strategy: "POETICS_CAP",
    poeticsSet: "Shire",
    poeticsItemLevel: 270,
    blurb:
      "Grab the Shire set with Poetics. It carries you straight into Stormblood.",
  },
  {
    id: "sb-leveling",
    label: "61–69 · Stormblood",
    min: 61,
    max: 69,
    expansion: "Stormblood",
    strategy: "MARKET_DUNGEON",
    blurb:
      "Stormblood leveling gear + dungeon drops. Buy in small jumps, don’t over-invest.",
  },
  {
    id: "lv70",
    label: "70 · Poetics Cap",
    min: 70,
    max: 70,
    expansion: "Stormblood",
    strategy: "POETICS_CAP",
    poeticsSet: "Scaevan",
    poeticsItemLevel: 400,
    blurb:
      "Buy the Scaevan set with Poetics to bridge into Shadowbringers.",
  },
  {
    id: "shb-leveling",
    label: "71–79 · Shadowbringers",
    min: 71,
    max: 79,
    expansion: "Shadowbringers",
    strategy: "MARKET_DUNGEON",
    blurb:
      "Shadowbringers leveling gear + dungeon drops. Cheap upgrades only.",
  },
  {
    id: "lv80",
    label: "80 · Poetics Cap",
    min: 80,
    max: 80,
    expansion: "Shadowbringers",
    strategy: "POETICS_CAP",
    poeticsSet: "Cryptlurker",
    poeticsItemLevel: 530,
    blurb:
      "Buy the Cryptlurker set with Poetics to bridge into Endwalker.",
  },
  {
    id: "ew-leveling",
    label: "81–89 · Endwalker",
    min: 81,
    max: 89,
    expansion: "Endwalker",
    strategy: "MARKET_DUNGEON",
    blurb:
      "Endwalker leveling gear + dungeon drops. Keep spending light.",
  },
  {
    id: "lv90",
    label: "90 · Endwalker → Dawntrail",
    min: 90,
    max: 90,
    expansion: "Endwalker",
    strategy: "POETICS_CAP",
    poeticsSet: "Radiant / Poetics",
    poeticsItemLevel: 620,
    blurb:
      "Use the level-90 Poetics set (Radiant) as a base, then start Dawntrail — early DT drops upgrade you fast.",
  },
  {
    id: "dt-leveling",
    label: "91–99 · Dawntrail",
    min: 91,
    max: 99,
    expansion: "Dawntrail",
    strategy: "MARKET_DUNGEON",
    blurb:
      "Dawntrail leveling gear + dungeon drops. Don’t splurge — endgame is at 100.",
  },
  {
    id: "lv100",
    label: "100 · Dawntrail Endgame",
    min: 100,
    max: 100,
    expansion: "Dawntrail",
    strategy: "ENDGAME",
    blurb:
      "Top of the food chain. Use current Tomestones (Mathematics/Aesthetics-style), dungeon/normal-raid drops, then crafted.",
  },
];

export function bracketForLevel(level: number): Bracket {
  return (
    BRACKETS.find((b) => level >= b.min && level <= b.max) ??
    BRACKETS[BRACKETS.length - 1]
  );
}

// Rough item-level estimate for a level, used when no gear snapshot exists.
// Not exact (FFXIV item levels are non-linear) but good enough for advice.
export function estimateItemLevel(level: number): number {
  const table: [number, number][] = [
    [1, 1],
    [15, 20],
    [30, 60],
    [49, 110],
    [50, 130],
    [59, 200],
    [60, 270],
    [69, 320],
    [70, 400],
    [79, 430],
    [80, 530],
    [89, 560],
    [90, 620],
    [99, 670],
    [100, 730],
  ];
  for (let i = 0; i < table.length - 1; i++) {
    const [l1, i1] = table[i];
    const [l2, i2] = table[i + 1];
    if (level >= l1 && level <= l2) {
      const t = l2 === l1 ? 0 : (level - l1) / (l2 - l1);
      return Math.round(i1 + t * (i2 - i1));
    }
  }
  return level >= 100 ? 730 : 1;
}
