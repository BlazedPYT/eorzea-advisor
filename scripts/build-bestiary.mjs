// Build the bundled Bestiary & Locator dataset from FFXIV Teamcraft's open data.
// Downloads the source files, joins them, and emits compact JSON into
// public/bestiary/ that the app reads at runtime (offline-friendly).
//
// Run: npm run data:bestiary   (only needed when game data changes / new patch)

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE =
  "https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/staging/libs/data/src/lib/json";
const OUT = path.join(process.cwd(), "public", "bestiary");

async function getJson(name) {
  const url = `${BASE}/${name}.json`;
  process.stdout.write(`  ↓ ${name}.json … `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const data = await res.json();
  console.log("ok");
  return data;
}

const round = (n) => Math.round(n * 10) / 10;

async function main() {
  console.log("Downloading Teamcraft data…");
  const [mobs, monsters, npcs, mapsRaw, places, aeth, shopsByNpc] = await Promise.all([
    getJson("mobs"),
    getJson("monsters"), // keyed by BNpcName id (same id space as mobs.json)
    getJson("npcs"),
    getJson("maps"),
    getJson("places"),
    getJson("aetherytes"),
    getJson("shops-by-npc"),
  ]);

  // Garland core data → location id → name (to name zones for mobs that have no
  // Mappy coordinates but that Garland still knows a zone for).
  process.stdout.write("  ↓ Garland locationIndex … ");
  let garlandLocations = {};
  try {
    const core = await (await fetch("https://www.garlandtools.org/db/doc/core/en/3/data.json")).json();
    for (const [id, v] of Object.entries(core.locationIndex || {})) {
      if (v?.name) garlandLocations[id] = v.name;
    }
    console.log(`ok (${Object.keys(garlandLocations).length})`);
  } catch {
    console.log("skipped (offline)");
  }

  const placeName = (id) => (id && places[id] && places[id].en) || "";

  // --- maps: id -> { image, sizeFactor, offsetX, offsetY, zone } ---
  const maps = {};
  for (const [id, m] of Object.entries(mapsRaw)) {
    if (!m || !m.image) continue;
    let zone = placeName(m.placename_id);
    const sub = placeName(m.placename_sub_id);
    if (sub && sub !== zone) zone = `${zone} – ${sub}`;
    maps[id] = {
      image: m.image,
      sizeFactor: m.size_factor || 100,
      offsetX: m.offset_x || 0,
      offsetY: m.offset_y || 0,
      zone: zone || "Unknown",
    };
  }

  // --- aetherytes grouped by map (main travel anchors) ---
  const aetherytesByMap = {};
  const zoneSet = new Map(); // mapId -> { mapId, zone, aetheryte }
  for (const a of aeth) {
    const name = placeName(a.nameid);
    if (!name) continue;
    const mid = String(a.map);
    (aetherytesByMap[mid] ??= []).push({ name, x: round(a.x), y: round(a.y), type: a.type });
    if (a.type === 0 && !zoneSet.has(mid)) {
      zoneSet.set(mid, { mapId: Number(mid), zone: maps[mid]?.zone ?? "Unknown", aetheryte: name });
    }
  }

  // --- entries: mobs + npcs/vendors ---
  const entries = {};

  // Mobs (with spawn positions). monsters.json is keyed directly by BNpcName id
  // (same id space as mobs.json), per Teamcraft's extractor. Some records carry
  // sentinel/garbage positions (absurd HP) — we drop those.
  let mobCount = 0;
  for (const [id, info] of Object.entries(monsters)) {
    const name = mobs[id]?.en;
    if (!name || !info.positions?.length) continue;
    const byMap = {};
    let maxLevel = 0;
    let fate = false;
    for (const p of info.positions) {
      if (p.hp && p.hp >= 50_000_000) continue; // sentinel / striking-dummy record
      if (p.map == null) continue;
      if (p.level && p.level > 0 && p.level < 1000) maxLevel = Math.max(maxLevel, p.level);
      if (p.fate) fate = true;
      const key = String(p.map);
      (byMap[key] ??= new Set()).add(`${round(p.x)},${round(p.y)}`);
    }
    if (Object.keys(byMap).length === 0) continue; // all positions were garbage
    const locations = Object.entries(byMap)
      .slice(0, 6)
      .map(([mapId, coordSet]) => ({
        mapId: Number(mapId),
        zone: maps[mapId]?.zone ?? "Unknown",
        points: Array.from(coordSet)
          .slice(0, 16)
          .map((c) => {
            const [x, y] = c.split(",").map(Number);
            return { x, y };
          }),
      }));
    entries[`mob:${id}`] = {
      id: Number(id),
      type: "mob",
      name,
      level: maxLevel || null,
      fate,
      locations,
    };
    mobCount++;
  }

  // NPCs + vendors (single position each)
  let npcCount = 0;
  let vendorCount = 0;
  for (const [id, n] of Object.entries(npcs)) {
    const name = n?.en;
    const pos = n?.position;
    if (!name || !pos || pos.map == null) continue;
    const isVendor = !!shopsByNpc[id];
    const title = n.title?.en || "";
    entries[`${isVendor ? "vendor" : "npc"}:${id}`] = {
      id: Number(id),
      type: isVendor ? "vendor" : "npc",
      name,
      title,
      locations: [
        {
          mapId: pos.map,
          zone: maps[String(pos.map)]?.zone ?? "Unknown",
          points: [{ x: round(pos.x), y: round(pos.y) }],
        },
      ],
    };
    if (isVendor) vendorCount++;
    else npcCount++;
  }

  // teleportable zones list for the "where are you?" picker
  const zones = Array.from(zoneSet.values()).sort((a, b) => a.zone.localeCompare(b.zone));

  // ALL named mobs (for comprehensive search, incl. ones without coordinates)
  const mobNames = {};
  for (const [id, v] of Object.entries(mobs)) {
    if (v?.en?.trim()) mobNames[id] = v.en;
  }

  // zone-name (lowercased) -> { mapId, image, sizeFactor, aetheryte } so we can
  // show a zone map + travel for coordinate-less mobs, bridged by name.
  const zoneIndex = {};
  for (const z of zoneSet.values()) {
    const m = maps[String(z.mapId)];
    zoneIndex[z.zone.toLowerCase()] = {
      mapId: z.mapId,
      image: m?.image ?? "",
      sizeFactor: m?.sizeFactor ?? 100,
      aetheryte: z.aetheryte,
    };
  }
  for (const [id, m] of Object.entries(maps)) {
    const key = m.zone.toLowerCase();
    if (!zoneIndex[key]) {
      zoneIndex[key] = { mapId: Number(id), image: m.image, sizeFactor: m.sizeFactor, aetheryte: null };
    }
  }

  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, "entries.json"), JSON.stringify(entries));
  await writeFile(path.join(OUT, "maps.json"), JSON.stringify(maps));
  await writeFile(path.join(OUT, "aetherytes.json"), JSON.stringify(aetherytesByMap));
  await writeFile(path.join(OUT, "zones.json"), JSON.stringify(zones));
  await writeFile(path.join(OUT, "mob-names.json"), JSON.stringify(mobNames));
  await writeFile(path.join(OUT, "garland-locations.json"), JSON.stringify(garlandLocations));
  await writeFile(path.join(OUT, "zone-index.json"), JSON.stringify(zoneIndex));

  console.log(
    `\n✓ Bestiary built → public/bestiary/\n  positioned mobs: ${mobCount}  all named mobs: ${
      Object.keys(mobNames).length
    }  npcs: ${npcCount}  vendors: ${vendorCount}  maps: ${
      Object.keys(maps).length
    }  zones: ${zones.length}`
  );
}

main().catch((e) => {
  console.error("✗ bestiary build failed:", e);
  process.exit(1);
});
