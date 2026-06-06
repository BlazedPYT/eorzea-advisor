import { promises as fs } from "fs";
import path from "path";
import type { CharacterProfile, GearSnapshotData } from "./types";

// ---------------------------------------------------------------------------
// Tiny JSON file store. Replaces Prisma/SQLite so the desktop build has no
// native database engine to bundle — it only ever holds one profile + gear
// snapshot. In the packaged Electron app the path is set via EORZEA_DATA_FILE
// (a writable file in the user's AppData); otherwise it falls back to ./data.
// ---------------------------------------------------------------------------

export interface StoreData {
  profile: (CharacterProfile & { id?: string }) | null;
  gear: GearSnapshotData | null;
}

const EMPTY: StoreData = { profile: null, gear: null };

function dataFile(): string {
  if (process.env.EORZEA_DATA_FILE) return process.env.EORZEA_DATA_FILE;
  return path.join(process.cwd(), "data", "eorzea.json");
}

export async function readStore(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(dataFile(), "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return { profile: parsed.profile ?? null, gear: parsed.gear ?? null };
  } catch {
    return { ...EMPTY };
  }
}

export async function writeStore(data: StoreData): Promise<void> {
  const file = dataFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}
