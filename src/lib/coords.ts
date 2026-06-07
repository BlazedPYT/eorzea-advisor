// Convert an in-game map coordinate (1..~42) to a 0..100% position on the 2048px
// map image, accounting for the map's size factor (zoom). Pure + client-safe.
export function coordToPercent(coord: number, sizeFactor: number): number {
  const pct = ((coord - 1) / 41) * (sizeFactor / 100) * 100;
  return Math.max(0, Math.min(100, pct));
}

// Inverse of coordToPercent: turn a 0..100% position on the map image back into
// an in-game map coordinate (1..~42). Used when a player clicks the map to drop
// a pin. Pure + client-safe.
export function percentToCoord(pct: number, sizeFactor: number): number {
  const coord = (Math.max(0, Math.min(100, pct)) / sizeFactor) * 41 + 1;
  // round to 1 decimal — the precision the game's coordinate display uses
  return Math.round(coord * 10) / 10;
}
