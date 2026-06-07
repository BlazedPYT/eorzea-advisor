"use client";

import { useEffect, useState } from "react";
import { nextDailyReset, nextWeeklyReset, formatCountdown } from "@/lib/resets";
import { InfoTip } from "./InfoTip";

// Live countdowns to the FFXIV daily (15:00 UTC) and weekly (Tue 08:00 UTC)
// resets. Ticks every second.
export function ResetClocks() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const daily = nextDailyReset(now) - now;
  const weekly = nextWeeklyReset(now) - now;

  return (
    <div className="glass flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-lavender-500/70 dark:text-lavender-300/60">
        ⏳ Resets
        <InfoTip text="Daily reset is 15:00 UTC (roulettes, beast-tribe & leve allowances, etc.). Weekly reset is Tuesday 08:00 UTC (raids, Wondrous Tails, weekly tomestone cap)." />
      </span>
      <Clock label="☀️ Daily" value={formatCountdown(daily)} />
      <Clock label="🗓️ Weekly" value={formatCountdown(weekly)} />
    </div>
  );
}

function Clock({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-display text-sm font-bold text-slate-800 tabular-nums dark:text-slate-100">{value}</span>
    </span>
  );
}
