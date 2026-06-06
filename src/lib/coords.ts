// Convert an in-game map coordinate (1..~42) to a 0..100% position on the 2048px
// map image, accounting for the map's size factor (zoom). Pure + client-safe.
export function coordToPercent(coord: number, sizeFactor: number): number {
  const pct = ((coord - 1) / 41) * (sizeFactor / 100) * 100;
  return Math.max(0, Math.min(100, pct));
}
