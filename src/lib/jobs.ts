import type { JobDef, Role } from "./types";

// ---------------------------------------------------------------------------
// Every supported combat job/class with role + Market Board stat suffix.
// The suffix is what appears after "of" in gear names, e.g. "of Healing".
// ---------------------------------------------------------------------------

export const JOBS: JobDef[] = [
  // Tanks
  { id: "GLA", name: "Gladiator", role: "TANK", suffix: "Fending", startingLevel: 1, color: "#a8d2f0", emoji: "🛡️" },
  { id: "PLD", name: "Paladin", baseClass: "Gladiator", role: "TANK", suffix: "Fending", startingLevel: 30, color: "#a8d2f0", emoji: "🛡️" },
  { id: "MRD", name: "Marauder", role: "TANK", suffix: "Fending", startingLevel: 1, color: "#cf4647", emoji: "🪓" },
  { id: "WAR", name: "Warrior", baseClass: "Marauder", role: "TANK", suffix: "Fending", startingLevel: 30, color: "#cf4647", emoji: "🪓" },
  { id: "DRK", name: "Dark Knight", role: "TANK", suffix: "Fending", startingLevel: 30, color: "#d126cc", emoji: "🗡️" },
  { id: "GNB", name: "Gunbreaker", role: "TANK", suffix: "Fending", startingLevel: 60, color: "#796d30", emoji: "🔫" },

  // Healers
  { id: "CNJ", name: "Conjurer", role: "HEALER", suffix: "Healing", startingLevel: 1, color: "#8fda7f", emoji: "🌿" },
  { id: "WHM", name: "White Mage", baseClass: "Conjurer", role: "HEALER", suffix: "Healing", startingLevel: 30, color: "#8fda7f", emoji: "✨" },
  { id: "SCH", name: "Scholar", baseClass: "Arcanist", role: "HEALER", suffix: "Healing", startingLevel: 30, color: "#8657ff", emoji: "📖" },
  { id: "AST", name: "Astrologian", role: "HEALER", suffix: "Healing", startingLevel: 30, color: "#ffe74a", emoji: "🔮" },
  { id: "SGE", name: "Sage", role: "HEALER", suffix: "Healing", startingLevel: 70, color: "#80a3f0", emoji: "💉" },

  // Melee DPS
  { id: "PGL", name: "Pugilist", role: "MELEE", suffix: "Striking", startingLevel: 1, color: "#d69c00", emoji: "👊" },
  { id: "MNK", name: "Monk", baseClass: "Pugilist", role: "MELEE", suffix: "Striking", startingLevel: 30, color: "#d69c00", emoji: "👊" },
  { id: "LNC", name: "Lancer", role: "MELEE", suffix: "Maiming", startingLevel: 1, color: "#4164cd", emoji: "🔱" },
  { id: "DRG", name: "Dragoon", baseClass: "Lancer", role: "MELEE", suffix: "Maiming", startingLevel: 30, color: "#4164cd", emoji: "🐉" },
  { id: "ROG", name: "Rogue", role: "MELEE", suffix: "Scouting", startingLevel: 1, color: "#af1964", emoji: "🗡️" },
  { id: "NIN", name: "Ninja", baseClass: "Rogue", role: "MELEE", suffix: "Scouting", startingLevel: 30, color: "#af1964", emoji: "🥷" },
  { id: "SAM", name: "Samurai", role: "MELEE", suffix: "Striking", startingLevel: 50, color: "#e46d04", emoji: "⚔️" },
  { id: "RPR", name: "Reaper", role: "MELEE", suffix: "Maiming", startingLevel: 70, color: "#965a90", emoji: "💀" },
  { id: "VPR", name: "Viper", role: "MELEE", suffix: "Scouting", startingLevel: 80, color: "#108210", emoji: "🐍" },

  // Physical Ranged DPS
  { id: "ARC", name: "Archer", role: "PHYS_RANGED", suffix: "Aiming", startingLevel: 1, color: "#c2b38a", emoji: "🏹" },
  { id: "BRD", name: "Bard", baseClass: "Archer", role: "PHYS_RANGED", suffix: "Aiming", startingLevel: 30, color: "#91ba5e", emoji: "🎵" },
  { id: "MCH", name: "Machinist", role: "PHYS_RANGED", suffix: "Aiming", startingLevel: 60, color: "#6ee1d6", emoji: "⚙️" },
  { id: "DNC", name: "Dancer", role: "PHYS_RANGED", suffix: "Aiming", startingLevel: 60, color: "#e2b0af", emoji: "💃" },

  // Magical Ranged DPS
  { id: "THM", name: "Thaumaturge", role: "MAGIC_RANGED", suffix: "Casting", startingLevel: 1, color: "#a579d6", emoji: "🔥" },
  { id: "BLM", name: "Black Mage", baseClass: "Thaumaturge", role: "MAGIC_RANGED", suffix: "Casting", startingLevel: 30, color: "#a579d6", emoji: "🔥" },
  { id: "ACN", name: "Arcanist", role: "MAGIC_RANGED", suffix: "Casting", startingLevel: 1, color: "#2d9b78", emoji: "📕" },
  { id: "SMN", name: "Summoner", baseClass: "Arcanist", role: "MAGIC_RANGED", suffix: "Casting", startingLevel: 30, color: "#2d9b78", emoji: "🐲" },
  { id: "RDM", name: "Red Mage", role: "MAGIC_RANGED", suffix: "Casting", startingLevel: 50, color: "#e87b7b", emoji: "🌹" },
  { id: "PCT", name: "Pictomancer", role: "MAGIC_RANGED", suffix: "Casting", startingLevel: 80, color: "#fc92e1", emoji: "🎨" },

  // Limited job
  { id: "BLU", name: "Blue Mage", role: "LIMITED", suffix: "Casting", startingLevel: 1, isLimited: true, color: "#4f9bff", emoji: "🔵" },
];

export const JOB_MAP: Record<string, JobDef> = Object.fromEntries(
  JOBS.map((j) => [j.id, j])
);

export function getJob(id: string): JobDef {
  return JOB_MAP[id] ?? JOBS[0];
}

export const ROLE_LABEL: Record<Role, string> = {
  TANK: "Tank",
  HEALER: "Healer",
  MELEE: "Melee DPS",
  PHYS_RANGED: "Physical Ranged DPS",
  MAGIC_RANGED: "Magical Ranged DPS",
  LIMITED: "Limited Job",
};

export const ROLE_EMOJI: Record<Role, string> = {
  TANK: "🛡️",
  HEALER: "💚",
  MELEE: "⚔️",
  PHYS_RANGED: "🏹",
  MAGIC_RANGED: "🔮",
  LIMITED: "🔵",
};

// Group jobs by role for nicer selectors
export const JOBS_BY_ROLE: { role: Role; jobs: JobDef[] }[] = (
  ["TANK", "HEALER", "MELEE", "PHYS_RANGED", "MAGIC_RANGED", "LIMITED"] as Role[]
).map((role) => ({ role, jobs: JOBS.filter((j) => j.role === role) }));
