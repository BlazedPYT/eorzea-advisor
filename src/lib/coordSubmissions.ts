// ---------------------------------------------------------------------------
// Community coordinate submissions (client-side).
//
// When the bundled map data has no exact spawn for a monster/NPC, a player can
// drop a pin where they actually found it. We do two things with that:
//   1. Save it to localStorage so the pin shows on THEIR map immediately and
//      survives reloads (and is included in backup codes).
//   2. Let them open a pre-filled GitHub issue so the maintainer can verify the
//      spot in-game and merge it into the bundled dataset for everyone.
//
// Pure + client-safe (guards against SSR — no window/localStorage on server).
// ---------------------------------------------------------------------------

import type { EntryType } from "./bestiary";

export const SUBMISSIONS_KEY = "ea-coord-submissions-v1";
const REPO = "BlazedPYT/eorzea-advisor";

export interface CoordSubmission {
  key: string; // bestiary entry key, e.g. "mob:123"
  id: number;
  type: EntryType;
  name: string;
  mapId: number;
  zone: string;
  x: number;
  y: number;
  ts: number; // when the player saved it
}

// Storage is a flat map keyed by entry+map so a player can pin the same monster
// in more than one zone.
type Store = Record<string, CoordSubmission>;

function slot(key: string, mapId: number): string {
  return `${key}@${mapId}`;
}

export function loadSubmissions(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || "{}") as Store;
  } catch {
    return {};
  }
}

export function getSubmission(key: string, mapId: number): CoordSubmission | null {
  return loadSubmissions()[slot(key, mapId)] ?? null;
}

export function saveSubmission(sub: CoordSubmission): void {
  if (typeof window === "undefined") return;
  const store = loadSubmissions();
  store[slot(sub.key, sub.mapId)] = sub;
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(store));
}

export function removeSubmission(key: string, mapId: number): void {
  if (typeof window === "undefined") return;
  const store = loadSubmissions();
  delete store[slot(key, mapId)];
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(store));
}

// Build a GitHub "new issue" URL pre-filled with everything the maintainer needs
// to verify the spot and paste it straight into public/bestiary/entries.json.
export function buildIssueUrl(sub: CoordSubmission): string {
  const title = `[coords] ${sub.name} — ${sub.zone}`;

  // A ready-to-merge entries.json snippet keyed by the entry key.
  const snippet = JSON.stringify(
    {
      [sub.key]: {
        id: sub.id,
        type: sub.type,
        name: sub.name,
        locations: [{ mapId: sub.mapId, zone: sub.zone, points: [{ x: sub.x, y: sub.y }] }],
      },
    },
    null,
    2
  );

  const body = [
    `**Monster / NPC:** ${sub.name}`,
    `**Entry key:** \`${sub.key}\``,
    `**Zone:** ${sub.zone} (mapId ${sub.mapId})`,
    `**Coordinates:** X: ${sub.x}, Y: ${sub.y}`,
    "",
    "_Submitted from Eorzea Advisor's Locator. Please verify in-game before merging._",
    "",
    "<details><summary>Ready-to-merge snippet for <code>public/bestiary/entries.json</code></summary>",
    "",
    "```json",
    snippet,
    "```",
    "",
    "</details>",
  ].join("\n");

  const params = new URLSearchParams({ title, body, labels: "coords" });
  return `https://github.com/${REPO}/issues/new?${params.toString()}`;
}
