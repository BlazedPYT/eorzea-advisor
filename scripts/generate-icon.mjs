// Renders build-assets/icon.svg into the PNG sizes Windows needs, then packs a
// multi-resolution icon.ico for electron-builder. Run: node scripts/generate-icon.mjs
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dir = path.join(process.cwd(), "build-assets");
const svg = await readFile(path.join(dir, "icon.svg"));

const sizes = [16, 24, 32, 48, 64, 128, 256];
const pngs = await Promise.all(
  sizes.map((s) => sharp(svg, { density: 384 }).resize(s, s).png().toBuffer())
);

// A 512 PNG too (handy for mac/linux/store art).
await sharp(svg, { density: 384 }).resize(512, 512).png().toFile(path.join(dir, "icon.png"));

const ico = await pngToIco(pngs);
await writeFile(path.join(dir, "icon.ico"), ico);

console.log(`✓ wrote build-assets/icon.ico (${sizes.join(", ")}) and icon.png (512)`);
