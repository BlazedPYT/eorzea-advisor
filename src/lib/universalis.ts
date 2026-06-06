import type { PriceInfo, TaxRates } from "./types";

// ---------------------------------------------------------------------------
// Universalis v2 client (keyless). Live Market Board data for FFXIV.
// https://docs.universalis.app/
//
// We query the player's whole Data Center (not just their world) so we can show
// the *cross-world cheapest* price + which world it's on — that's how FFXIV
// players actually shop. We also surface live sale velocity, the most recent
// sale, and per-city retainer tax rates (the real "goblin tax").
// ---------------------------------------------------------------------------

const BASE = "https://universalis.app/api/v2";
const UA = "EorzeaAdvisor/1.0 (companion app)";

interface RawListing {
  pricePerUnit: number;
  hq: boolean;
  worldName?: string;
}
interface RawHistory {
  pricePerUnit: number;
  hq: boolean;
  timestamp: number; // seconds
  worldName?: string;
}
interface RawMarket {
  itemID: number;
  lastUploadTime?: number;
  minPrice?: number;
  minPriceNQ?: number;
  minPriceHQ?: number;
  averagePriceNQ?: number;
  averagePriceHQ?: number;
  regularSaleVelocity?: number;
  listings?: RawListing[];
  recentHistory?: RawHistory[];
  hasData?: boolean;
}

// ---- World -> Data Center resolution (cached) -----------------------------
let dcCache: { worldToDc: Record<string, string>; ts: number } | null = null;

async function loadWorldMap(): Promise<Record<string, string>> {
  if (dcCache && Date.now() - dcCache.ts < 86_400_000) return dcCache.worldToDc;
  try {
    const [worldsRes, dcRes] = await Promise.all([
      fetch(`${BASE}/worlds`, { headers: { "User-Agent": UA }, next: { revalidate: 86400 } }),
      fetch(`${BASE}/data-centers`, { headers: { "User-Agent": UA }, next: { revalidate: 86400 } }),
    ]);
    const worlds = (await worldsRes.json()) as { id: number; name: string }[];
    const dcs = (await dcRes.json()) as { name: string; worlds: number[] }[];
    const idToName: Record<number, string> = {};
    for (const w of worlds) idToName[w.id] = w.name;
    const worldToDc: Record<string, string> = {};
    for (const dc of dcs) {
      for (const id of dc.worlds) {
        const name = idToName[id];
        if (name) worldToDc[name.toLowerCase()] = dc.name;
      }
    }
    dcCache = { worldToDc, ts: Date.now() };
    return worldToDc;
  } catch {
    return {};
  }
}

/** Resolve the best query scope: the player's DC (for cross-world pricing). */
export async function resolveScope(world: string): Promise<string> {
  if (!world) return "Aether";
  const map = await loadWorldMap();
  return map[world.toLowerCase()] ?? world;
}

function toPriceInfo(raw: RawMarket, scope: string): PriceInfo {
  const sorted = (raw.listings ?? []).slice().sort((a, b) => a.pricePerUnit - b.pricePerUnit);
  const cheapestListing = sorted[0];
  const lastSale = raw.recentHistory?.[0];
  return {
    itemId: raw.itemID,
    cheapest: raw.minPrice || cheapestListing?.pricePerUnit || undefined,
    cheapestHq: raw.minPriceHQ || undefined,
    averageNq: raw.averagePriceNQ ? Math.round(raw.averagePriceNQ) : undefined,
    averageHq: raw.averagePriceHQ ? Math.round(raw.averagePriceHQ) : undefined,
    lastUploadMs: raw.lastUploadTime,
    worldName: cheapestListing?.worldName,
    scope,
    salesPerDay: raw.regularSaleVelocity ? Math.round(raw.regularSaleVelocity * 10) / 10 : undefined,
    lastSalePrice: lastSale?.pricePerUnit,
    lastSaleMs: lastSale?.timestamp ? lastSale.timestamp * 1000 : undefined,
  };
}

/**
 * Price one or more items across the player's Data Center. Returns a map keyed
 * by item id with cross-world cheapest, velocity and last-sale info.
 */
export async function priceItems(
  world: string,
  itemIds: number[]
): Promise<Record<number, PriceInfo>> {
  const ids = Array.from(new Set(itemIds.filter((n) => Number.isFinite(n) && n > 0)));
  if (ids.length === 0) return {};
  const scope = await resolveScope(world);

  const url = `${BASE}/${encodeURIComponent(scope)}/${ids.join(
    ","
  )}?listings=8&entries=3`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, next: { revalidate: 180 } });
    if (!res.ok) {
      return Object.fromEntries(ids.map((id) => [id, { itemId: id, error: `HTTP ${res.status}` }]));
    }
    const data = await res.json();
    const out: Record<number, PriceInfo> = {};
    if (data.items) {
      for (const key of Object.keys(data.items)) {
        out[Number(key)] = toPriceInfo(data.items[key] as RawMarket, scope);
      }
    } else if (data.itemID) {
      out[data.itemID] = toPriceInfo(data as RawMarket, scope);
    }
    for (const id of ids) if (!out[id]) out[id] = { itemId: id, error: "No market data" };
    return out;
  } catch (err) {
    return Object.fromEntries(
      ids.map((id) => [id, { itemId: id, error: err instanceof Error ? err.message : "fetch failed" }])
    );
  }
}

/** Live retainer/counter Market Board tax rates per city for a world. */
export async function getTaxRates(world: string): Promise<TaxRates | null> {
  const scope = world || "Gilgamesh";
  try {
    const res = await fetch(`${BASE}/tax-rates?world=${encodeURIComponent(scope)}`, {
      headers: { "User-Agent": UA },
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, number>;
    const rates = Object.entries(data).map(([city, rate]) => ({ city, rate }));
    if (!rates.length) return null;
    const lowest = rates.reduce((a, b) => (b.rate < a.rate ? b : a));
    return { scope, rates, lowest };
  } catch {
    return null;
  }
}
