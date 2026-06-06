// ---------------------------------------------------------------------------
// FFXIV reset timers. Daily reset = 15:00 UTC every day. Weekly reset =
// Tuesday 08:00 UTC. We use these to auto-clear the checklist when a new
// period starts, and to show a live countdown.
// ---------------------------------------------------------------------------

const DAY = 86_400_000;
const WEEK = 7 * DAY;

export function lastDailyReset(now = Date.now()): number {
  const d = new Date(now);
  const reset = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 15, 0, 0);
  return now >= reset ? reset : reset - DAY;
}

export function nextDailyReset(now = Date.now()): number {
  return lastDailyReset(now) + DAY;
}

export function lastWeeklyReset(now = Date.now()): number {
  const d = new Date(now);
  const day = d.getUTCDay(); // 0 Sun … 6 Sat
  const backToTuesday = (day - 2 + 7) % 7;
  let reset = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() - backToTuesday,
    8,
    0,
    0
  );
  if (now < reset) reset -= WEEK; // today is Tuesday but before 08:00 UTC
  return reset;
}

export function nextWeeklyReset(now = Date.now()): number {
  return lastWeeklyReset(now) + WEEK;
}

/** Stable keys for the current reset windows (used to auto-reset stored state). */
export function dailyKey(now = Date.now()): string {
  return `d:${lastDailyReset(now)}`;
}
export function weeklyKey(now = Date.now()): string {
  return `w:${lastWeeklyReset(now)}`;
}

/** Format a millisecond duration as "12h 34m" / "3d 2h" / "45s". */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "now";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
