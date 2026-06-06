import type { GearSlot, GearSuffix } from "./types";

// ---------------------------------------------------------------------------
// XIVAPI v2 (beta) client for STATIC game data: item names, item levels,
// icons, equip slots, job/level restrictions. Keyless.
// https://v2.xivapi.com/
//
// This is what makes the gear advisor dynamic: instead of hardcoding gear, we
// query the game's own data for the right piece at the player's slot + level +
// role stat suffix.
// ---------------------------------------------------------------------------

const BASE = "https://beta.xivapi.com/api/1";

export interface ResolvedItem {
  id: number;
  name: string;
  levelEquip: number;
  levelItem?: number;
}

// EquipSlotCategory row id -> our GearSlot. Rings (12) map to both ring slots.
const ESC_TO_SLOT: Record<number, GearSlot> = {
  3: "Head",
  4: "Body",
  5: "Hands",
  7: "Legs",
  8: "Feet",
  9: "Earrings",
  10: "Necklace",
  11: "Bracelet",
  12: "Ring1",
};

interface SearchResult {
  results?: {
    row_id: number;
    fields: {
      Name?: string;
      LevelEquip?: number;
      LevelItem?: { value?: number } | number;
      EquipSlotCategory?: { value?: number } | number;
    };
  }[];
}

function escValue(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "value" in v) return (v as any).value;
  return undefined;
}

async function search(query: string, fields: string, limit = 50): Promise<SearchResult> {
  const url = `${BASE}/search?sheets=Item&query=${encodeURIComponent(
    query
  )}&fields=${encodeURIComponent(fields)}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "EorzeaAdvisor/0.1" },
    next: { revalidate: 86400 }, // static data — cache a day
  });
  if (!res.ok) throw new Error(`XIVAPI ${res.status}`);
  return (await res.json()) as SearchResult;
}

/**
 * Free-text item search for the in-app Market Board. Mirrors the in-game search:
 * optional category (ItemSearchCategory) filter, and only marketable items
 * (ItemSearchCategory >= 1) are returned.
 */
export async function searchItems(
  q: string,
  opts: { category?: number; limit?: number } = {}
): Promise<{ id: number; name: string }[]> {
  const clean = q.replace(/\s+HQ$/i, "").trim();
  const limit = opts.limit ?? 20;
  const clauses: string[] = [];
  if (clean.length >= 2) clauses.push(`Name~"${clean}"`);
  if (opts.category) clauses.push(`ItemSearchCategory=${opts.category}`);
  else clauses.push(`ItemSearchCategory>=1`); // marketable only
  if (clean.length < 2 && !opts.category) return []; // need a name or a category

  try {
    const data = await search(clauses.join(" "), "Name", limit);
    return (data.results ?? [])
      .filter((r) => r.fields.Name)
      .map((r) => ({ id: r.row_id, name: r.fields.Name as string }));
  } catch {
    return [];
  }
}

export interface ItemCategory {
  id: number;
  name: string;
  group: number;
}

// Group number -> friendly label (matches the in-game Market Board tabs).
const CATEGORY_GROUP: Record<number, string> = {
  1: "Weapons & Tools",
  2: "Armor & Accessories",
  3: "Items & Materials",
  4: "Housing & Furnishings",
};

export function categoryGroupLabel(group: number): string {
  return CATEGORY_GROUP[group] ?? "Other";
}

/** The in-game Market Board categories (ItemSearchCategory sheet). */
export async function getSearchCategories(): Promise<ItemCategory[]> {
  try {
    const res = await fetch(
      `${BASE}/sheet/ItemSearchCategory?limit=200&fields=Name,Category,Order`,
      { headers: { "User-Agent": "EorzeaAdvisor/1.0" }, next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      rows?: { row_id: number; fields: { Name?: string; Category?: number; Order?: number } }[];
    };
    return (data.rows ?? [])
      .filter((r) => r.fields.Name && r.fields.Name.trim().length > 0 && (r.fields.Category ?? 0) >= 1)
      .map((r) => ({
        id: r.row_id,
        name: r.fields.Name as string,
        group: r.fields.Category ?? 0,
      }))
      .sort((a, b) => a.group - b.group || a.id - b.id);
  } catch {
    return [];
  }
}

/** Resolve a single item id by (near-)exact name. Strips a trailing " HQ". */
export async function searchItemByName(name: string): Promise<ResolvedItem | null> {
  const clean = name.replace(/\s+HQ$/i, "").trim();
  try {
    const data = await search(`Name~"${clean}"`, "Name,LevelEquip", 5);
    const exact = data.results?.find(
      (r) => r.fields.Name?.toLowerCase() === clean.toLowerCase()
    );
    const pick = exact ?? data.results?.[0];
    if (!pick || !pick.fields.Name) return null;
    return {
      id: pick.row_id,
      name: pick.fields.Name,
      levelEquip: pick.fields.LevelEquip ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve the best gear piece for each slot for a given role stat suffix at a
 * given level. One batched query gets armor + accessories at once; we bucket by
 * equip slot and keep the highest LevelEquip per slot.
 */
export async function resolveGearBySuffix(
  suffix: GearSuffix,
  level: number
): Promise<Partial<Record<GearSlot, ResolvedItem>>> {
  if (suffix === "—") return {};
  const lo = Math.max(1, level - 6);
  const query = `Name~"of ${suffix}" LevelEquip>=${lo} LevelEquip<=${level}`;
  let data: SearchResult;
  try {
    data = await search(query, "Name,LevelEquip,EquipSlotCategory", 50);
  } catch {
    return {};
  }

  const best: Partial<Record<GearSlot, ResolvedItem>> = {};
  for (const r of data.results ?? []) {
    const esc = escValue(r.fields.EquipSlotCategory);
    if (esc == null) continue;
    const slot = ESC_TO_SLOT[esc];
    if (!slot) continue;
    const item: ResolvedItem = {
      id: r.row_id,
      name: r.fields.Name ?? "",
      levelEquip: r.fields.LevelEquip ?? 0,
    };
    const current = best[slot];
    if (!current || item.levelEquip > current.levelEquip) best[slot] = item;
  }

  // Mirror the ring to the second ring slot.
  if (best.Ring1) best.Ring2 = best.Ring1;
  return best;
}
