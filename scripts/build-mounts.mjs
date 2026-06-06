// Build the bundled Mounts + Minions dataset from FFXIV Collect (images + how
// to obtain). Emits public/mounts/. Run: npm run data:mounts

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "mounts");

async function fetchCollection(kind) {
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
    image: kind === "mounts" ? `https://ffxivcollect.com/images/mounts/${m.id}.png` : m.icon,
    sources: (m.sources || []).map((s) => ({ type: s.type, text: s.text })),
    tradeable: !!m.tradeable,
    patch: m.patch || "",
    description: (m.description || "").trim(),
  }));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const kind of ["mounts", "minions"]) {
    process.stdout.write(`  ↓ ${kind} … `);
    const list = await fetchCollection(kind);
    await writeFile(path.join(OUT, `${kind}.json`), JSON.stringify(list));
    console.log(`${list.length}`);
  }
  console.log("✓ Mounts/Minions built → public/mounts/");
}

main().catch((e) => {
  console.error("✗ mounts build failed:", e);
  process.exit(1);
});
