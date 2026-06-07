// ---------------------------------------------------------------------------
// FFXIV crafting actions + macro wait logic, matching the convention used by
// Teamcraft / Craftingway: each action emits `/ac "Name" <wait.N>` where N is
// the action's wait duration. Most actions are 3s; buff/utility actions are 2s
// (this mirrors Teamcraft's CraftingAction.getWaitDuration()).
// ---------------------------------------------------------------------------

export type ActionCat = "Synthesis" | "Quality" | "Buff" | "Utility";

export interface CraftAction {
  name: string;
  cat: ActionCat;
  wait: 2 | 3;
  emoji: string;
}

// Buff / instant utility actions = <wait.2>. Everything else = <wait.3>.
const WAIT2 = new Set(
  [
    "Inner Quiet",
    "Veneration",
    "Innovation",
    "Great Strides",
    "Final Appraisal",
    "Waste Not",
    "Waste Not II",
    "Manipulation",
    "Observe",
    "Careful Observation",
    "Heart and Soul",
    "Tricks of the Trade",
    "Quick Innovation",
    "Trained Perfection",
  ].map((s) => s.toLowerCase())
);

export const CRAFT_ACTIONS: CraftAction[] = [
  // Progress (Synthesis)
  { name: "Muscle Memory", cat: "Synthesis", wait: 3, emoji: "💪" },
  { name: "Reflect", cat: "Quality", wait: 3, emoji: "🪞" },
  { name: "Basic Synthesis", cat: "Synthesis", wait: 3, emoji: "🔨" },
  { name: "Careful Synthesis", cat: "Synthesis", wait: 3, emoji: "🔨" },
  { name: "Prudent Synthesis", cat: "Synthesis", wait: 3, emoji: "🔨" },
  { name: "Groundwork", cat: "Synthesis", wait: 3, emoji: "🔨" },
  { name: "Intensive Synthesis", cat: "Synthesis", wait: 3, emoji: "🔨" },
  { name: "Rapid Synthesis", cat: "Synthesis", wait: 3, emoji: "⚡" },
  { name: "Delicate Synthesis", cat: "Synthesis", wait: 3, emoji: "✨" },
  // Quality (Touches)
  { name: "Basic Touch", cat: "Quality", wait: 3, emoji: "🤍" },
  { name: "Standard Touch", cat: "Quality", wait: 3, emoji: "🤍" },
  { name: "Advanced Touch", cat: "Quality", wait: 3, emoji: "🤍" },
  { name: "Refined Touch", cat: "Quality", wait: 3, emoji: "🤍" },
  { name: "Prudent Touch", cat: "Quality", wait: 3, emoji: "🤍" },
  { name: "Preparatory Touch", cat: "Quality", wait: 3, emoji: "🤍" },
  { name: "Precise Touch", cat: "Quality", wait: 3, emoji: "🎯" },
  { name: "Hasty Touch", cat: "Quality", wait: 3, emoji: "🎲" },
  { name: "Daring Touch", cat: "Quality", wait: 3, emoji: "🎲" },
  { name: "Trained Touch", cat: "Quality", wait: 3, emoji: "🤍" },
  { name: "Trained Finesse", cat: "Quality", wait: 3, emoji: "🌟" },
  { name: "Byregot's Blessing", cat: "Quality", wait: 3, emoji: "🙏" },
  { name: "Trained Eye", cat: "Quality", wait: 3, emoji: "👁️" },
  // Buffs
  { name: "Inner Quiet", cat: "Buff", wait: 2, emoji: "🔵" },
  { name: "Veneration", cat: "Buff", wait: 2, emoji: "🔥" },
  { name: "Innovation", cat: "Buff", wait: 2, emoji: "💡" },
  { name: "Great Strides", cat: "Buff", wait: 2, emoji: "📈" },
  { name: "Final Appraisal", cat: "Buff", wait: 2, emoji: "🎓" },
  { name: "Waste Not", cat: "Buff", wait: 2, emoji: "♻️" },
  { name: "Waste Not II", cat: "Buff", wait: 2, emoji: "♻️" },
  { name: "Manipulation", cat: "Buff", wait: 2, emoji: "🛠️" },
  { name: "Quick Innovation", cat: "Buff", wait: 2, emoji: "💡" },
  { name: "Trained Perfection", cat: "Buff", wait: 2, emoji: "🏅" },
  // Utility / CP / durability
  { name: "Master's Mend", cat: "Utility", wait: 3, emoji: "🔧" },
  { name: "Immaculate Mend", cat: "Utility", wait: 3, emoji: "🔧" },
  { name: "Observe", cat: "Utility", wait: 2, emoji: "👀" },
  { name: "Careful Observation", cat: "Utility", wait: 2, emoji: "👀" },
  { name: "Heart and Soul", cat: "Utility", wait: 2, emoji: "❤️" },
  { name: "Tricks of the Trade", cat: "Utility", wait: 2, emoji: "🎩" },
];

export function normAction(s: string): string {
  return s.replace(/["']/g, (m) => (m === "'" ? "'" : "")).toLowerCase().replace(/\s+/g, " ").trim();
}

// Common shorthands people type.
const ALIASES: Record<string, string> = {
  mm: "Muscle Memory",
  bt: "Basic Touch",
  st: "Standard Touch",
  at: "Advanced Touch",
  byregot: "Byregot's Blessing",
  byregots: "Byregot's Blessing",
  bb: "Byregot's Blessing",
  gs: "Great Strides",
  wn: "Waste Not",
  "wn2": "Waste Not II",
  "waste not 2": "Waste Not II",
  manip: "Manipulation",
  ven: "Veneration",
  inno: "Innovation",
  groundwork: "Groundwork",
  "prep touch": "Preparatory Touch",
  prep: "Preparatory Touch",
  tof: "Trained Finesse",
  "trained finess": "Trained Finesse",
};

const BY_NORM = new Map(CRAFT_ACTIONS.map((a) => [normAction(a.name), a]));

export function resolveAction(input: string): { name: string; wait: 2 | 3; known: boolean } {
  const raw = input.replace(/^\/ac\s+/i, "").replace(/<wait\.\d+>/i, "").trim();
  const n = normAction(raw);
  const alias = ALIASES[n];
  const canonical = alias ?? raw;
  const found = BY_NORM.get(normAction(canonical));
  if (found) return { name: found.name, wait: found.wait, known: true };
  // Unknown name: pass through, default wait 3 (Teamcraft's base).
  return { name: raw, wait: WAIT2.has(n) ? 2 : 3, known: false };
}
