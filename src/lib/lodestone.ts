import type { GearItem, GearSlot } from "./types";

// ---------------------------------------------------------------------------
// Lodestone "sync" — a SAFE, public, read-only snapshot.
//
// FFXIV has no official live gear API (unlike WoW Armory). The Lodestone is a
// public website that updates only when the character logs out, so this data
// can be hours/days stale. We never use a plugin, memory reader, or anything
// that violates the FFXIV third-party tool policy — we just read public HTML,
// exactly like a browser. Treat every result as a possibly-delayed snapshot.
// ---------------------------------------------------------------------------

const REGIONS = ["na", "eu", "jp"] as const;
const UA =
  "Mozilla/5.0 (compatible; EorzeaAdvisor/0.1; +companion app, public Lodestone read)";

// Lodestone equipment tooltip index -> our GearSlot.
// (5 = belt/waist, removed from the game; 1 = off-hand/shield; 13 = soul crystal)
const SLOT_INDEX: Record<number, GearSlot> = {
  0: "Weapon",
  2: "Head",
  3: "Body",
  4: "Hands",
  6: "Legs",
  7: "Feet",
  8: "Earrings",
  9: "Necklace",
  10: "Bracelet",
  11: "Ring1",
  12: "Ring2",
};

export interface LodestoneResult {
  id: string;
  name?: string;
  world?: string;
  activeJobLevel?: number;
  items: GearItem[];
  url: string;
}

function decode(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

/** Pull a Lodestone character id out of a pasted URL, if present. */
export function parseLodestoneId(input: string): string | null {
  const m = input.match(/lodestone\/character\/(\d+)/);
  if (m) return m[1];
  if (/^\d{6,}$/.test(input.trim())) return input.trim();
  return null;
}

async function lodeFetch(path: string): Promise<{ html: string; region: string } | null> {
  for (const region of REGIONS) {
    try {
      const res = await fetch(`https://${region}.finalfantasyxiv.com${path}`, {
        headers: { "User-Agent": UA, "X-Requested-With": "XMLHttpRequest" },
        next: { revalidate: 300 },
      });
      if (res.ok) return { html: await res.text(), region };
    } catch {
      /* try next region */
    }
  }
  return null;
}

/** Find a character id by name + world via the Lodestone search page. */
export async function findCharacterId(
  name: string,
  world: string
): Promise<string | null> {
  const q = encodeURIComponent(name);
  const w = encodeURIComponent(world);
  const found = await lodeFetch(`/lodestone/character/?q=${q}&worldname=${w}`);
  if (!found) return null;
  const m = found.html.match(/\/lodestone\/character\/(\d+)\//);
  return m ? m[1] : null;
}

export interface CharacterMatch {
  id: string;
  name: string;
  world: string;
  dc?: string;
  avatar?: string;
}

/** Live search for characters by (partial) name, for type-ahead suggestions. */
export async function searchCharacters(
  name: string,
  world?: string,
  limit = 8
): Promise<CharacterMatch[]> {
  if (!name || name.trim().length < 2) return [];
  let path = `/lodestone/character/?q=${encodeURIComponent(name.trim())}`;
  if (world) path += `&worldname=${encodeURIComponent(world)}`;
  const found = await lodeFetch(path);
  if (!found) return [];

  const re =
    /href="\/lodestone\/character\/(\d+)\/"\s+class="entry__link">[\s\S]*?entry__chara__face"><img src="([^"]+)"[^>]*>[\s\S]*?entry__name">([^<]+)<[\s\S]*?entry__world">(?:<i[^>]*><\/i>)?\s*([^<]+)</g;

  const out: CharacterMatch[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(found.html)) && out.length < limit) {
    const [, id, avatar, rawName, rawWorld] = m;
    const worldName = decode(rawWorld).split("[")[0].trim();
    const dc = decode(rawWorld).match(/\[([^\]]+)\]/)?.[1];
    out.push({ id, name: decode(rawName), world: worldName, dc, avatar });
  }
  return out;
}

async function fetchItemName(id: string, index: number): Promise<string | null> {
  const res = await lodeFetch(`/lodestone/character/${id}/equipment/tooltip/${index}`);
  if (!res) return null;
  const m = res.html.match(/db-tooltip__item__name[^>]*>([^<]+)</);
  if (!m) return null;
  const name = decode(m[1]);
  return name.length ? name : null;
}

/** Fetch a public gear snapshot for a character id. */
export async function fetchGearSnapshot(id: string): Promise<LodestoneResult | null> {
  const profile = await lodeFetch(`/lodestone/character/${id}/`);
  if (!profile) return null;
  const html = profile.html;

  const nameMatch = html.match(/frame__chara__name[^>]*>([^<]+)</);
  // World text follows an <i> icon: frame__chara__world"><i …></i>World [DC]</p>
  const worldMatch = html.match(/frame__chara__world[^>]*>(?:<i[^>]*><\/i>)?\s*([^<]+)</);
  const levelMatch = html.match(/character__class__data[^>]*>\s*<p>\s*LEVEL\s*(\d+)/i);

  // Fetch all equipment tooltips in parallel.
  const indices = Object.keys(SLOT_INDEX).map(Number);
  const results = await Promise.all(
    indices.map(async (idx) => ({ idx, name: await fetchItemName(id, idx) }))
  );

  const items: GearItem[] = results
    .filter((r) => r.name)
    .map((r) => ({ slot: SLOT_INDEX[r.idx], name: r.name as string }));

  return {
    id,
    name: nameMatch ? decode(nameMatch[1]) : undefined,
    world: worldMatch ? decode(worldMatch[1]).split("[")[0].trim() : undefined,
    activeJobLevel: levelMatch ? Number(levelMatch[1]) : undefined,
    items,
    url: `https://na.finalfantasyxiv.com/lodestone/character/${id}/`,
  };
}
