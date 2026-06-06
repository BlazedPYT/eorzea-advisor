import { promises as fs } from "fs";
import path from "path";
export { coordToPercent } from "./coords";

// ---------------------------------------------------------------------------
// Bestiary & Locator data layer. Reads the bundled Teamcraft-derived dataset
// (public/bestiary/*.json) once into memory, then serves search + entry +
// travel lookups. No runtime third-party calls — works offline.
// ---------------------------------------------------------------------------

export type EntryType = "mob" | "npc" | "vendor";

export interface RawPoint {
  x: number;
  y: number;
}
export interface RawLocation {
  mapId: number;
  zone: string;
  points: RawPoint[];
}
export interface RawEntry {
  id: number;
  type: EntryType;
  name: string;
  title?: string;
  level?: number | null;
  fate?: boolean;
  locations: RawLocation[];
}

export interface MapMeta {
  image: string;
  sizeFactor: number;
  offsetX: number;
  offsetY: number;
  zone: string;
}

export interface Aetheryte {
  name: string;
  x: number;
  y: number;
  type: number;
}

export interface ZoneOption {
  mapId: number;
  zone: string;
  aetheryte: string;
}

export interface SearchHit {
  key: string;
  id: number;
  type: EntryType;
  name: string;
  subtitle: string; // title or primary zone
}

export interface EnrichedLocation extends RawLocation {
  image: string;
  sizeFactor: number;
  aetheryte: Aetheryte | null;
}

export interface BestiaryEntry {
  key: string;
  id: number;
  type: EntryType;
  name: string;
  title?: string;
  level?: number | null;
  fate?: boolean;
  locations: EnrichedLocation[];
}

interface Data {
  entries: Record<string, RawEntry>;
  maps: Record<string, MapMeta>;
  aetherytes: Record<string, Aetheryte[]>;
  zones: ZoneOption[];
  index: { key: string; lname: string; hit: SearchHit }[];
}

let cache: Promise<Data> | null = null;

async function readJson<T>(file: string): Promise<T> {
  const p = path.join(process.cwd(), "public", "bestiary", file);
  return JSON.parse(await fs.readFile(p, "utf8")) as T;
}

function load(): Promise<Data> {
  if (cache) return cache;
  cache = (async () => {
    const [entries, maps, aetherytes, zones] = await Promise.all([
      readJson<Record<string, RawEntry>>("entries.json"),
      readJson<Record<string, MapMeta>>("maps.json"),
      readJson<Record<string, Aetheryte[]>>("aetherytes.json"),
      readJson<ZoneOption[]>("zones.json"),
    ]);
    const index = Object.entries(entries).map(([key, e]) => ({
      key,
      lname: e.name.toLowerCase(),
      hit: {
        key,
        id: e.id,
        type: e.type,
        name: e.name,
        subtitle: e.title || e.locations[0]?.zone || "",
      } as SearchHit,
    }));
    return { entries, maps, aetherytes, zones, index };
  })();
  return cache;
}

const TYPE_RANK: Record<EntryType, number> = { mob: 0, vendor: 1, npc: 2 };

export async function searchBestiary(query: string, limit = 30): Promise<SearchHit[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const { index } = await load();
  const scored: { score: number; hit: SearchHit }[] = [];
  for (const row of index) {
    const i = row.lname.indexOf(q);
    if (i === -1) continue;
    // exact = 0, startsWith = 1, word-start = 2, contains = 3
    let score = 3;
    if (row.lname === q) score = 0;
    else if (i === 0) score = 1;
    else if (row.lname[i - 1] === " ") score = 2;
    score += TYPE_RANK[row.hit.type] * 0.1 + row.lname.length * 0.001;
    scored.push({ score, hit: row.hit });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.hit);
}

function nearestAetheryte(
  data: Data,
  mapId: number,
  x: number,
  y: number
): Aetheryte | null {
  const list = data.aetherytes[String(mapId)] ?? [];
  if (!list.length) return null;
  const mains = list.filter((a) => a.type === 0);
  const pool = mains.length ? mains : list;
  let best: Aetheryte | null = null;
  let bestD = Infinity;
  for (const a of pool) {
    const d = (a.x - x) ** 2 + (a.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

export async function getEntry(key: string): Promise<BestiaryEntry | null> {
  const data = await load();
  const e = data.entries[key];
  if (!e) return null;
  const locations: EnrichedLocation[] = e.locations.map((loc) => {
    const meta = data.maps[String(loc.mapId)];
    const center = loc.points[0] ?? { x: 0, y: 0 };
    return {
      ...loc,
      image: meta?.image ?? "",
      sizeFactor: meta?.sizeFactor ?? 100,
      aetheryte: nearestAetheryte(data, loc.mapId, center.x, center.y),
    };
  });
  return { key, id: e.id, type: e.type, name: e.name, title: e.title, level: e.level, fate: e.fate, locations };
}

export async function getZones(): Promise<ZoneOption[]> {
  return (await load()).zones;
}
