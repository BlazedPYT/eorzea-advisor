// Build the bundled Levequest dataset from XIVAPI (Leve sheet) + reuse the
// bestiary NPC positions for each levemete (issuer). Emits public/leves/.
// Run: npm run data:leves   (needs public/bestiary/entries.json to exist)

import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const XIV = "https://beta.xivapi.com/api/1";
const OUT = path.join(process.cwd(), "public", "leves");

// LeveAssignmentType.Name -> our category
function categorize(type) {
  if (!type) return "Other";
  if (type === "Battlecraft") return "Battlecraft";
  if (["Miner", "Botanist", "Fisher"].includes(type)) return "Fieldcraft";
  if (["The Maelstrom", "Order of the Twin Adder", "Immortal Flames"].includes(type))
    return "Grand Company";
  return "Tradecraft"; // the 8 crafting jobs
}

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "EorzeaAdvisor/1.0" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

async function main() {
  // 1) page the whole Leve sheet
  console.log("Paging XIVAPI Leve sheet…");
  const leves = [];
  let after = null;
  for (let page = 0; page < 20; page++) {
    const afterParam = after == null ? "" : `&after=${after}`;
    const url = `${XIV}/sheet/Leve?limit=500${afterParam}&fields=Name,ClassJobLevel,LeveAssignmentType.Name,PlaceNameStartZone.Name,ExpReward,AllowanceCost,DataId@as(raw),LevelLevemete@as(raw)`;
    const d = await getJson(url);
    const rows = d.rows || [];
    if (rows.length === 0) break;
    for (const r of rows) {
      const f = r.fields;
      if (!f.Name || !f.ClassJobLevel) continue;
      leves.push({
        id: r.row_id,
        name: f.Name,
        level: f.ClassJobLevel,
        type: f.LeveAssignmentType?.fields?.Name || "",
        zone: f.PlaceNameStartZone?.fields?.Name || "",
        exp: f.ExpReward || 0,
        allowance: f.AllowanceCost || 1,
        dataId: f["DataId@as(raw)"] || 0,
        levelId: f["LevelLevemete@as(raw)"] || 0,
      });
    }
    after = rows[rows.length - 1].row_id;
    process.stdout.write(`  …${leves.length} leves\r`);
  }
  console.log(`\n  collected ${leves.length} leves`);

  // 2) resolve distinct Level rows -> levemete NPC id
  const levelIds = [...new Set(leves.map((l) => l.levelId).filter(Boolean))];
  console.log(`Resolving ${levelIds.length} levemete locations…`);
  const levelToNpc = {};
  for (let i = 0; i < levelIds.length; i += 100) {
    const chunk = levelIds.slice(i, i + 100);
    const d = await getJson(`${XIV}/sheet/Level?rows=${chunk.join(",")}&fields=Object@as(raw)`);
    for (const r of d.rows || []) levelToNpc[r.row_id] = r.fields["Object@as(raw)"] || 0;
  }

  // 2b) tradecraft leves: resolve the items you must craft/turn in (CraftLeve),
  //     so we can tell players what to bring or buy on the Market Board.
  const craftIds = [
    ...new Set(leves.filter((l) => categorize(l.type) === "Tradecraft").map((l) => l.dataId).filter(Boolean)),
  ];
  console.log(`Resolving ${craftIds.length} tradecraft requirements…`);
  const reqByData = {};
  for (let i = 0; i < craftIds.length; i += 100) {
    const chunk = craftIds.slice(i, i + 100);
    const d = await getJson(`${XIV}/sheet/CraftLeve?rows=${chunk.join(",")}&fields=Item%5B%5D.Name,ItemCount,Repeats`);
    for (const r of d.rows || []) {
      const f = r.fields;
      const items = f.Item || [];
      const counts = f.ItemCount || [];
      const required = [];
      for (let j = 0; j < items.length; j++) {
        const id = items[j]?.row_id;
        const name = items[j]?.fields?.Name;
        const count = counts[j] || 0;
        if (id && name && count > 0) required.push({ id, name, count });
      }
      reqByData[r.row_id] = { required, repeats: f.Repeats || 0 };
    }
    process.stdout.write(`  …${Math.min(i + 100, craftIds.length)}/${craftIds.length}\r`);
  }
  console.log("");

  // 2c) recipe ingredients for each leve turn-in item (what to craft / buy).
  const leveItemIds = new Set();
  for (const v of Object.values(reqByData)) for (const it of v.required) leveItemIds.add(it.id);
  console.log(`Resolving recipes for ${leveItemIds.size} leve items…`);
  const ingByResult = {};
  let rAfter = null;
  for (let page = 0; page < 40; page++) {
    const ap = rAfter == null ? "" : `&after=${rAfter}`;
    const d = await getJson(
      `${XIV}/sheet/Recipe?limit=500${ap}&fields=ItemResult@as(raw),Ingredient@as(raw),AmountIngredient`
    );
    const rows = d.rows || [];
    if (!rows.length) break;
    for (const r of rows) {
      const rid = r.fields["ItemResult@as(raw)"];
      if (!leveItemIds.has(rid)) continue;
      const ids = r.fields["Ingredient@as(raw)"] || [];
      const amts = r.fields.AmountIngredient || [];
      const ing = [];
      for (let j = 0; j < ids.length; j++) {
        if (ids[j] > 0 && amts[j] > 0) ing.push({ id: ids[j], amount: amts[j] });
      }
      ingByResult[rid] = ing;
    }
    rAfter = rows[rows.length - 1].row_id;
  }
  // resolve ingredient names
  const ingIds = [...new Set(Object.values(ingByResult).flat().map((g) => g.id))];
  const nameById = {};
  for (let i = 0; i < ingIds.length; i += 200) {
    const chunk = ingIds.slice(i, i + 200);
    const d = await getJson(`${XIV}/sheet/Item?rows=${chunk.join(",")}&fields=Name`);
    for (const r of d.rows || []) nameById[r.row_id] = r.fields.Name;
  }
  // attach ingredients onto each required item
  for (const v of Object.values(reqByData)) {
    for (const it of v.required) {
      it.ingredients = (ingByResult[it.id] || []).map((g) => ({
        id: g.id,
        name: nameById[g.id] || `#${g.id}`,
        amount: g.amount,
      }));
    }
  }

  // 3) levemete NPC id -> name + position, from the bundled bestiary data,
  //    enriched with the map image + nearest aetheryte (self-contained leves).
  const B = path.join(process.cwd(), "public", "bestiary");
  const entries = JSON.parse(await readFile(path.join(B, "entries.json"), "utf8"));
  const maps = JSON.parse(await readFile(path.join(B, "maps.json"), "utf8"));
  const aeth = JSON.parse(await readFile(path.join(B, "aetherytes.json"), "utf8"));

  function nearestAetheryte(mapId, x, y) {
    const list = aeth[String(mapId)] || [];
    const mains = list.filter((a) => a.type === 0);
    const pool = mains.length ? mains : list;
    let best = null, bestD = Infinity;
    for (const a of pool) {
      const d = (a.x - x) ** 2 + (a.y - y) ** 2;
      if (d < bestD) { bestD = d; best = a; }
    }
    return best ? best.name : null;
  }

  function npcInfo(npcId) {
    const e = entries[`npc:${npcId}`] || entries[`vendor:${npcId}`];
    if (!e || !e.locations?.length) return null;
    const loc = e.locations[0];
    const m = maps[String(loc.mapId)];
    const x = loc.points[0]?.x, y = loc.points[0]?.y;
    return {
      name: e.name,
      zone: loc.zone,
      mapId: loc.mapId,
      x,
      y,
      image: m?.image || "",
      sizeFactor: m?.sizeFactor || 100,
      aetheryte: nearestAetheryte(loc.mapId, x ?? 0, y ?? 0),
    };
  }

  // 4) assemble
  let withLoc = 0;
  const out = leves.map((l) => {
    const npcId = levelToNpc[l.levelId] || 0;
    const info = npcId ? npcInfo(npcId) : null;
    if (info) withLoc++;
    return {
      id: l.id,
      name: l.name,
      level: l.level,
      type: l.type,
      category: categorize(l.type),
      zone: l.zone,
      exp: l.exp,
      allowance: l.allowance,
      expPerAllowance: l.allowance ? Math.round(l.exp / l.allowance) : l.exp,
      levemeteId: npcId || null,
      levemete: info ? info.name : null,
      issueZone: info ? info.zone : null,
      mapId: info ? info.mapId : null,
      x: info ? info.x : null,
      y: info ? info.y : null,
      image: info ? info.image : null,
      sizeFactor: info ? info.sizeFactor : null,
      aetheryte: info ? info.aetheryte : null,
      required: reqByData[l.dataId]?.required || [],
      repeats: reqByData[l.dataId]?.repeats || 0,
    };
  });

  out.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, "leves.json"), JSON.stringify(out));

  const byCat = {};
  for (const l of out) byCat[l.category] = (byCat[l.category] || 0) + 1;
  console.log(`\n✓ Leves built → public/leves/leves.json`);
  console.log(`  total ${out.length} · with location ${withLoc} · by category`, byCat);
}

main().catch((e) => {
  console.error("✗ leves build failed:", e);
  process.exit(1);
});
