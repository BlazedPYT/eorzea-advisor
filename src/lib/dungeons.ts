// ---------------------------------------------------------------------------
// Leveling dungeons by unlock level. Used by the route + queue advisor to pick
// the *highest useful* leveling dungeon for the player's current level.
// "level" = the level at which the dungeon unlocks / becomes the best EXP/run.
// ---------------------------------------------------------------------------

export interface Dungeon {
  level: number;
  name: string;
  expansion: string;
  // The level at which you should move on to the next one (for route notes)
  goodUntil?: number;
}

export const LEVELING_DUNGEONS: Dungeon[] = [
  // A Realm Reborn
  { level: 15, name: "Sastasha", expansion: "ARR" },
  { level: 16, name: "The Tam-Tara Deepcroft", expansion: "ARR" },
  { level: 17, name: "Copperbell Mines", expansion: "ARR" },
  { level: 20, name: "Halatali", expansion: "ARR" },
  { level: 24, name: "Brayflox's Longstop", expansion: "ARR" },
  { level: 28, name: "The Stone Vigil", expansion: "ARR" },
  { level: 32, name: "Dzemael Darkhold", expansion: "ARR" },
  { level: 35, name: "Aurum Vale", expansion: "ARR" },
  { level: 41, name: "The Sunken Temple of Qarn", expansion: "ARR" },
  { level: 44, name: "The Wanderer's Palace", expansion: "ARR" },
  { level: 47, name: "Amdapor Keep", expansion: "ARR" },
  { level: 50, name: "The Keeper of the Lake / Wanderer's Palace (Hard)", expansion: "ARR" },

  // Heavensward
  { level: 51, name: "The Dusk Vigil", expansion: "HW" },
  { level: 53, name: "Sohm Al", expansion: "HW" },
  { level: 55, name: "The Aery", expansion: "HW" },
  { level: 57, name: "The Vault", expansion: "HW" },
  { level: 59, name: "The Great Gubal Library", expansion: "HW" },
  { level: 60, name: "The Aetherochemical Research Facility", expansion: "HW" },

  // Stormblood
  { level: 61, name: "The Sirensong Sea", expansion: "SB" },
  { level: 63, name: "Bardam's Mettle", expansion: "SB" },
  { level: 65, name: "Doma Castle", expansion: "SB" },
  { level: 67, name: "Castrum Abania", expansion: "SB" },
  { level: 69, name: "The Temple of the Fist", expansion: "SB" },
  { level: 70, name: "Kugane Castle", expansion: "SB" },

  // Shadowbringers
  { level: 71, name: "Holminster Switch", expansion: "ShB" },
  { level: 73, name: "Dohn Mheg", expansion: "ShB" },
  { level: 75, name: "The Qitana Ravel", expansion: "ShB" },
  { level: 77, name: "Malikah's Well", expansion: "ShB" },
  { level: 79, name: "Mt. Gulg", expansion: "ShB" },
  { level: 80, name: "Amaurot", expansion: "ShB" },

  // Endwalker
  { level: 81, name: "The Tower of Zot", expansion: "EW" },
  { level: 83, name: "The Tower of Babil", expansion: "EW" },
  { level: 85, name: "Vanaspati", expansion: "EW" },
  { level: 87, name: "Ktisis Hyperboreia", expansion: "EW" },
  { level: 89, name: "The Aitiascope", expansion: "EW" },
  { level: 90, name: "The Dead Ends", expansion: "EW" },

  // Dawntrail
  { level: 91, name: "Ihuykatumu", expansion: "DT" },
  { level: 93, name: "Worqor Zormor", expansion: "DT" },
  { level: 95, name: "The Skydeep Cenote", expansion: "DT" },
  { level: 97, name: "Vanguard", expansion: "DT" },
  { level: 99, name: "Origenics", expansion: "DT" },
  { level: 100, name: "Alexandria", expansion: "DT" },
];

// Highest leveling dungeon the player can run at their current level.
export function highestDungeonForLevel(level: number): Dungeon | undefined {
  const eligible = LEVELING_DUNGEONS.filter((d) => d.level <= level);
  return eligible[eligible.length - 1];
}

// The next dungeon to look forward to.
export function nextDungeonAfter(level: number): Dungeon | undefined {
  return LEVELING_DUNGEONS.find((d) => d.level > level);
}

// Build a focused route from the current level up to the next bracket break.
export function routeFromLevel(level: number, untilLevel: number): Dungeon[] {
  return LEVELING_DUNGEONS.filter((d) => d.level >= level - 1 && d.level <= untilLevel);
}
