// ---------------------------------------------------------------------------
// Crafting & Gathering (Disciples of the Hand / Land) knowledge base.
// Static, curated, noob-friendly. The EXP-to-next-level table is bundled at
// public/crafting/exp.json (fetched at runtime).
// ---------------------------------------------------------------------------

export type DiscType = "DoH" | "DoL";

export interface CraftJob {
  id: string;
  name: string;
  abbr: string;
  type: DiscType;
  emoji: string;
  color: string;
  guild: string; // where the class quests / guild are
  makes: string; // what it makes, in plain words
}

export const CRAFT_JOBS: CraftJob[] = [
  { id: "CRP", name: "Carpenter", abbr: "CRP", type: "DoH", emoji: "🪚", color: "#a06b3a", guild: "Gridania", makes: "wooden weapons, bows, furniture, tools" },
  { id: "BSM", name: "Blacksmith", abbr: "BSM", type: "DoH", emoji: "🔨", color: "#8a8f98", guild: "Limsa Lominsa", makes: "metal weapons & DoH/DoL tools" },
  { id: "ARM", name: "Armorer", abbr: "ARM", type: "DoH", emoji: "🛡️", color: "#7d8aa0", guild: "Limsa Lominsa", makes: "plate armor & shields" },
  { id: "GSM", name: "Goldsmith", abbr: "GSM", type: "DoH", emoji: "💍", color: "#e0a92e", guild: "Ul'dah", makes: "accessories, casting weapons, gems" },
  { id: "LTW", name: "Leatherworker", abbr: "LTW", type: "DoH", emoji: "🧵", color: "#9c5a2e", guild: "Gridania", makes: "leather gear & DoL aprons" },
  { id: "WVR", name: "Weaver", abbr: "WVR", type: "DoH", emoji: "🪡", color: "#b06fb0", guild: "Ul'dah", makes: "cloth gear & glamour fashion" },
  { id: "ALC", name: "Alchemist", abbr: "ALC", type: "DoH", emoji: "⚗️", color: "#4caf7d", guild: "Ul'dah", makes: "potions, elixirs, wands & dyes" },
  { id: "CUL", name: "Culinarian", abbr: "CUL", type: "DoH", emoji: "🍳", color: "#e0673a", guild: "Limsa Lominsa", makes: "food (the EXP/stat buffs everyone wants)" },
];

export const GATHER_JOBS: CraftJob[] = [
  { id: "MIN", name: "Miner", abbr: "MIN", type: "DoL", emoji: "⛏️", color: "#c9a23a", guild: "Ul'dah", makes: "ore, gems, stone, shards" },
  { id: "BTN", name: "Botanist", abbr: "BTN", type: "DoL", emoji: "🌿", color: "#5fae54", guild: "Gridania", makes: "wood, fibres, herbs, food crops" },
  { id: "FSH", name: "Fisher", abbr: "FSH", type: "DoL", emoji: "🎣", color: "#4f9bd9", guild: "Limsa Lominsa", makes: "fish (for cooking & some craft mats)" },
];

export const ALL_DISCIPLES = [...CRAFT_JOBS, ...GATHER_JOBS];

export function getDiscipline(id: string): CraftJob | undefined {
  return ALL_DISCIPLES.find((j) => j.id === id);
}

// A speed-leveling method available over a level range.
export interface Method {
  name: string;
  min: number;
  max: number;
  detail: string;
  best?: boolean; // the recommended primary method for this range
}

// Crafter (DoH) leveling methods — ordered; `best` marks the go-to per range.
export const DOH_METHODS: Method[] = [
  { name: "Class quests", min: 1, max: 90, detail: "Pick up the job quest every 5 levels from your guild — big EXP and unlocks new actions. Always do these.", best: false },
  { name: "Levequests (triple turn-in)", min: 1, max: 100, detail: "The backbone of fast crafting. Take the highest-level tradecraft leve you can, HAND IN HQ, and use repeatable leves for ~3× EXP. See the Leves tab for exact items + Market Board buy links.", best: true },
  { name: "Grand Company supply & provisioning", min: 1, max: 90, detail: "Daily timed turn-ins from your GC for a chunky EXP bonus (HQ doubles it). Free and fast each day.", best: false },
  { name: "Your daily Ixali / tribal crafts", min: 1, max: 50, detail: "Ixal beast-tribe dailies (unlock ~lv 1 crafter) give steady early EXP.", best: false },
  { name: "Custom Deliveries (Collectables)", min: 10, max: 100, detail: "Weekly satisfaction turn-ins — great EXP + gil + scrips once unlocked. Low effort.", best: false },
  { name: "Ishgardian Restoration (Skybuilders')", min: 20, max: 80, detail: "Craft Skybuilders' items in bulk — excellent AFK-ish EXP from 20–80, especially during Firmament events.", best: true },
  { name: "Studium deliveries", min: 80, max: 90, detail: "Sharlayan student deliveries — strong EXP from 80–90.", best: false },
  { name: "Collectables / scrip crafting", min: 50, max: 100, detail: "Turn in collectables for scrips and EXP at end-game tiers.", best: false },
];

// Gatherer (DoL) leveling methods.
export const DOL_METHODS: Method[] = [
  { name: "Class quests", min: 1, max: 90, detail: "Job quest every 5 levels from your guild. Always do them for EXP + unlocks.", best: false },
  { name: "Just gather everything at your level", min: 1, max: 100, detail: "Hit nodes at or slightly above your level; favour unspoiled/HQ. Gathering itself is fast EXP for DoL.", best: true },
  { name: "Levequests", min: 1, max: 100, detail: "Fieldcraft leves help, but raw node gathering and collectables usually beat them for DoL.", best: false },
  { name: "Grand Company provisioning", min: 1, max: 90, detail: "Daily GC gathering turn-ins for bonus EXP.", best: false },
  { name: "Collectables", min: 50, max: 100, detail: "Gather collectables for scrips + strong EXP at higher tiers.", best: true },
  { name: "Ishgardian Restoration", min: 20, max: 80, detail: "Skybuilders' gathering nodes give great EXP from 20–80.", best: false },
  { name: "Studium deliveries", min: 80, max: 90, detail: "Sharlayan deliveries — solid 80–90 EXP.", best: false },
];

export function methodsFor(type: DiscType): Method[] {
  return type === "DoH" ? DOH_METHODS : DOL_METHODS;
}

// The single best recommendation at a given level.
export function bestMethodAt(type: DiscType, level: number): Method | undefined {
  const inRange = methodsFor(type).filter((m) => level >= m.min && level <= m.max);
  return inRange.find((m) => m.best) ?? inRange[0];
}

// Noob-friendly tips per discipline type.
export const DOH_TIPS: string[] = [
  "Keep your TOOLS and gear current — a craft job uses a main tool (e.g., saw) + secondary tool. Upgrade both every ~10 levels (cheap on the Market Board or from your guild vendor).",
  "Turn in HQ whenever you can — HQ leve/GC/delivery turn-ins give roughly double EXP.",
  "Food gives a small EXP buff and helps you hit HQ — eat something cheap (see the Food tab).",
  "Learn the core rotation: build quality with Basic/Standard Touch, then finish with Synthesis. Macros help once you have a stable rotation.",
  "Level one crafter ahead to make your own gear/tools for the others, or just buy them — the eight crafters feed each other.",
];

export const DOL_TIPS: string[] = [
  "Gear matters for gatherers: keep your main tool current and meld Gathering/Perception so nodes don't fail.",
  "Use your gathering buffs (e.g., increase yield/HQ) every node — free EXP and materials.",
  "GP (gathering points) is your resource — spend it on yield/collectable actions, let it regen between nodes.",
  "Collectables are the fastest scrips + great EXP once unlocked (~level 50).",
  "Gathered mats sell well on the Market Board — gathering funds your crafting.",
];

export function tipsFor(type: DiscType): string[] {
  return type === "DoH" ? DOH_TIPS : DOL_TIPS;
}
