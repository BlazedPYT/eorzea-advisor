"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { CharacterProfile, AdvisorResult } from "@/lib/types";
import { getJob } from "@/lib/jobs";
import { highestDungeonForLevel } from "@/lib/dungeons";
import {
  dailyKey,
  weeklyKey,
  nextDailyReset,
  nextWeeklyReset,
  formatCountdown,
} from "@/lib/resets";

interface Task {
  id: string;
  label: string;
  note?: string;
  emoji: string;
}

const STORAGE_KEY = "ea-checklist-v1";

interface Stored {
  dailyKey: string;
  weeklyKey: string;
  daily: Record<string, boolean>;
  weekly: Record<string, boolean>;
}

function buildTasks(p: CharacterProfile, advice: AdvisorResult) {
  const job = getJob(p.job);
  const highest = highestDungeonForLevel(p.level);
  const maxed = p.level >= 100;
  const leveling = !maxed && !job.isLimited;

  const daily: Task[] = [];
  const weekly: Task[] = [];

  if (job.isLimited) {
    daily.push({ id: "carnivale", label: "Masked Carnivale challenge", emoji: "🎭" });
  } else if (maxed) {
    daily.push({ id: "expert", label: "Expert Roulette", note: "Current tomestones", emoji: "🏆" });
    daily.push({ id: "leveling-roulette", label: "Leveling Roulette", note: "Still good gil + bonus", emoji: "⭐" });
    daily.push({ id: "alliance", label: "Alliance Raid Roulette", emoji: "🎲" });
  } else if (leveling) {
    daily.push({ id: "leveling-roulette", label: "Daily Leveling Roulette", note: "Your #1 EXP — do this first", emoji: "⭐" });
    if (highest)
      daily.push({ id: "highest-dungeon", label: `Spam ${highest.name}`, note: "Best leveling dungeon right now", emoji: "🗝️" });
    daily.push({ id: "food", label: "Keep EXP food active", note: "+3% Well Fed buff", emoji: "🍳" });
    daily.push({ id: "society", label: "Allied Society dailies", note: "If unlocked near your level", emoji: "🤝" });
  }

  // Weeklies
  if (p.level >= 60) weekly.push({ id: "wondrous", label: "Wondrous Tails", note: "Khloe in Idyllshire — big EXP/reward", emoji: "📔" });
  weekly.push({ id: "challenge", label: "Challenge Log", note: "Weekly bonus objectives", emoji: "📋" });
  if (p.level >= 80) weekly.push({ id: "custom", label: "Custom Deliveries", note: "Chill weekly EXP + gil", emoji: "📦" });

  return { daily, weekly };
}

export function DailyChecklist({
  profile,
  advice,
}: {
  profile: CharacterProfile;
  advice: AdvisorResult;
}) {
  const { daily, weekly } = useMemo(() => buildTasks(profile, advice), [profile, advice]);
  const [state, setState] = useState<Stored | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Live clock for the countdowns (ticks every second).
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load + auto-reset when the period rolls over.
  useEffect(() => {
    const dk = dailyKey();
    const wk = weeklyKey();
    let loaded: Stored | null = null;
    try {
      loaded = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      loaded = null;
    }
    const next: Stored = {
      dailyKey: dk,
      weeklyKey: wk,
      daily: loaded && loaded.dailyKey === dk ? loaded.daily : {},
      weekly: loaded && loaded.weeklyKey === wk ? loaded.weekly : {},
    };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [now >= 0 ? dailyKey(now) : "", weeklyKey(now)]);

  function toggle(group: "daily" | "weekly", id: string) {
    setState((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        [group]: { ...prev[group], [id]: !prev[group][id] },
      } as Stored;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  if (!state) return null;

  const dailyDone = daily.filter((t) => state.daily[t.id]).length;
  const weeklyDone = weekly.filter((t) => state.weekly[t.id]).length;

  return (
    <section className="space-y-3">
      <h3 className="section-title">✅ Daily &amp; weekly checklist</h3>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChecklistCard
          title="Dailies"
          emoji="☀️"
          resetLabel={`Resets in ${formatCountdown(nextDailyReset(now) - now)}`}
          done={dailyDone}
          total={daily.length}
          tasks={daily}
          checked={state.daily}
          onToggle={(id) => toggle("daily", id)}
        />
        <ChecklistCard
          title="Weeklies"
          emoji="🗓️"
          resetLabel={`Resets in ${formatCountdown(nextWeeklyReset(now) - now)}`}
          done={weeklyDone}
          total={weekly.length}
          tasks={weekly}
          checked={state.weekly}
          onToggle={(id) => toggle("weekly", id)}
        />
      </div>
      <p className="px-1 text-[11px] text-slate-400">
        Auto-resets at FFXIV reset (daily 15:00 UTC · weekly Tuesday 08:00 UTC). Saved on
        this device.
      </p>
    </section>
  );
}

function ChecklistCard({
  title,
  emoji,
  resetLabel,
  done,
  total,
  tasks,
  checked,
  onToggle,
}: {
  title: string;
  emoji: string;
  resetLabel: string;
  done: number;
  total: number;
  tasks: Task[];
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const pct = total ? (done / total) * 100 : 0;
  const allDone = total > 0 && done === total;

  return (
    <div className="glass p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">
            {title}
          </span>
          {allDone && (
            <span className="chip bg-emerald-100 text-emerald-700 ring-emerald-200">
              all done! 🎉
            </span>
          )}
        </div>
        <span className="chip bg-lavender-100 text-lavender-700 ring-lavender-200 dark:bg-white/10 dark:text-lavender-200">
          ⏳ {resetLabel}
        </span>
      </div>

      {/* progress bar */}
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-lavender-200/50 dark:bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-lavender-500 to-emerald-400"
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <ul className="space-y-1.5">
        {tasks.length === 0 && (
          <li className="text-sm text-slate-400">Nothing here for this job/level right now.</li>
        )}
        {tasks.map((t) => {
          const isChecked = !!checked[t.id];
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onToggle(t.id)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all",
                  isChecked
                    ? "bg-emerald-50/70 dark:bg-emerald-500/10"
                    : "bg-white/50 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
                )}
              >
                <span
                  className={clsx(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition-all",
                    isChecked
                      ? "border-emerald-400 bg-emerald-400 text-white"
                      : "border-lavender-300 bg-white/60 dark:border-white/20 dark:bg-transparent"
                  )}
                >
                  {isChecked ? "✓" : ""}
                </span>
                <span className="min-w-0">
                  <span
                    className={clsx(
                      "flex items-center gap-1.5 font-semibold",
                      isChecked
                        ? "text-slate-400 line-through"
                        : "text-slate-800 dark:text-slate-100"
                    )}
                  >
                    <span>{t.emoji}</span>
                    {t.label}
                  </span>
                  {t.note && (
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      {t.note}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
