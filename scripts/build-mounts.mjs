// Build the bundled Mounts + Minions dataset from FFXIV Collect (images + how
// to obtain). Emits public/mounts/. Run: npm run data:mounts

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "mounts");

const XIV = "https://beta.xivapi.com/api/1";

// Duty name (lowercased) -> { level, ilvl } from XIVAPI ContentFinderCondition,
// so a mount's trial/raid/dungeon source can show the level needed to enter.
async function fetchContentLevels() {
  const cfc = {};
  let after = null;
  for (let p = 0; p < 8; p++) {
    const ap = after == null ? "" : `&after=${after}`;
    const res = await fetch(
      `${XIV}/sheet/ContentFinderCondition?limit=500${ap}&fields=Name,ClassJobLevelRequired,ItemLevelRequired`,
      { headers: { "User-Agent": "EorzeaAdvisor/1.0" } }
    );
    if (!res.ok) break;
    const rows = (await res.json()).rows || [];
    if (!rows.length) break;
    for (const r of rows) {
      const n = r.fields.Name;
      if (n && n.trim()) {
        cfc[n.toLowerCase()] = {
          level: r.fields.ClassJobLevelRequired || 0,
          ilvl: r.fields.ItemLevelRequired || 0,
        };
      }
    }
    after = rows[rows.length - 1].row_id;
  }
  return cfc;
}

async function fetchCollection(kind, cfc) {
  const res = await fetch(`https://ffxivcollect.com/api/${kind}`, {
    headers: { "User-Agent": "EorzeaAdvisor/1.0" },
  });
  if (!res.ok) throw new Error(`${kind}: HTTP ${res.status}`);
  const data = await res.json();
  const rows = data.results || [];
  return rows.map((m) => ({
    id: m.id,
    name: m.name,
    icon: m.icon || null,
    image: m.image || m.icon || null, // large render from FFXIV Collect
    itemId: m.item_id || null, // tradeable item → live Market Board price
    sources: (m.sources || []).map((s) => {
      const lv = cfc[(s.text || "").toLowerCase()];
      return { type: s.type, text: s.text, level: lv?.level || null, ilvl: lv?.ilvl || null };
    }),
    tradeable: !!m.tradeable,
    patch: m.patch || "",
    description: (m.description || "").trim(),
  }));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  process.stdout.write("  ↓ content levels … ");
  const cfc = await fetchContentLevels();
  console.log(`${Object.keys(cfc).length}`);
  for (const kind of ["mounts", "minions"]) {
    process.stdout.write(`  ↓ ${kind} … `);
    const list = await fetchCollection(kind, cfc);
    await writeFile(path.join(OUT, `${kind}.json`), JSON.stringify(list));
    console.log(`${list.length}`);
  }
  console.log("✓ Mounts/Minions built → public/mounts/");
}

main().catch((e) => {
  console.error("✗ mounts build failed:", e);
  process.exit(1);
});
