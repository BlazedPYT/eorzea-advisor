// Next's standalone output needs `public/` and `.next/static/` copied in next
// to server.js — Next doesn't do this automatically. This script assembles a
// complete, runnable server bundle in .next/standalone before packaging.

import { cp, mkdir, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!existsSync(standalone)) {
    console.error(
      "✗ .next/standalone not found. Run `next build` first (output: 'standalone')."
    );
    process.exit(1);
  }

  // .next/static -> .next/standalone/.next/static
  const staticSrc = path.join(root, ".next", "static");
  const staticDest = path.join(standalone, ".next", "static");
  if (await exists(staticSrc)) {
    await mkdir(path.dirname(staticDest), { recursive: true });
    await cp(staticSrc, staticDest, { recursive: true });
    console.log("✓ copied .next/static");
  }

  // public -> .next/standalone/public
  const publicSrc = path.join(root, "public");
  const publicDest = path.join(standalone, "public");
  if (await exists(publicSrc)) {
    await cp(publicSrc, publicDest, { recursive: true });
    console.log("✓ copied public");
  }

  console.log("✓ standalone bundle assembled at .next/standalone");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
