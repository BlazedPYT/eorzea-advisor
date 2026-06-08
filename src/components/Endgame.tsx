"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { CharacterProfile } from "@/lib/types";
import { resolveExperience } from "@/lib/experience";
import { weeklyKey, nextWeeklyReset, formatCountdown } from "@/lib/resets";
import { InfoTip } from "./InfoTip";

// ---------------------------------------------------------------------------
// The Endgame (100+) section — the max-level loop: tomestone gearing, the
// raid → savage ladder, extremes/unreal, relics and hunts, plus a weekly
// endgame target checklist. Curated guidance; tomestone/raid *names* rotate
// each major patch, so we label them as such rather than hard-promising one.
// ---------------------------------------------------------------------------

interface Card {
  emoji: string;
  title: string;
  body: string;
  steps?: string[];
}

const CARDS: Card[] = [
  {
    emoji: "🪙",
    title: "Gearing at cap",
    body: "At 100 you stop leveling gear and start the weekly tomestone loop. Two tomestones run at once: an uncapped one (buy freely) and a capped one (limited per week) for the best pieces.",
    steps: [
      "Run Expert Roulette daily for the capped tomestone + a quick gil/loot top-up.",
      "Cap your weekly capped tomestones, then spend uncapped ones on the rest of the set.",
      "Fill gaps with the current normal raid drops and crafted/augmented pieces.",
      "Tomestone names rotate each major patch (e.g. Aesthetics/Heliometry) — the loop stays the same.",
    ],
  },
  {
    emoji: "⚔️",
    title: "Raid → Savage ladder",
    body: "Clear the current normal raid tier first for the story and easy gear, then step up to Savage for the best non-crafted gear and the real challenge.",
    steps: [
      "Normal raid: unlimited clears, drops tokens you trade for gear.",
      "Savage: one loot lockout per fight per week — plan which fight to farm.",
      "Use a static or Party Finder; watch a quick guide before pulling each floor.",
      "Don't forget the weekly book/upgrade item from clears.",
    ],
  },
  {
    emoji: "🌪️",
    title: "Extreme & Unreal trials",
    body: "Extremes drop weapons/mounts and teach mechanics; Unreal recycles an old trial each patch for a weekly Faux Hollows reward.",
    steps: [
      "Farm current Extreme trials for totems → guaranteed weapon + mount chance.",
      "Unreal: one weekly Faux Hollows roll from the Faux Commander.",
    ],
  },
  {
    emoji: "🗡️",
    title: "Relic weapon",
    body: "Each expansion has a long relic weapon grind — a steady between-lockouts goal that ends in a glowing, fully-melded weapon.",
    steps: [
      "Check whether this patch has unlocked the relic line yet (they release in steps).",
      "Knock out a step or two on days you're not raiding — it's a marathon, not a sprint.",
    ],
  },
  {
    emoji: "🎯",
    title: "Hunts & tribal/society",
    body: "Hunt marks give tomestones, gil and Sacks/Seals for materia and minions. Daily and weekly elite marks plus hunt trains add up fast.",
    steps: [
      "Daily + weekly Hunt mark bills from the hunt boards.",
      "Join hunt trains (in-game LS/Discord) for relink S/A spawns.",
      "Allied Society dailies at cap still hand out EXP-irrelevant but useful currency/rewards.",
    ],
  },
  {
    emoji: "💎",
    title: "Ultimate (for the hardcore)",
    body: "Ultimates are the hardest fights in the game — 15–20 minute encounters for a prestige weapon and a clear title. Pure flex, fully optional.",
  },
];

interface WeeklyTask {
  id: string;
  label: string;
  note?: string;
  emoji: string;
}

const WEEKLY_TASKS: WeeklyTask[] = [
  { id: "tome-cap", label: "Cap weekly (capped) tomestones", note: "450/week — your best gear currency", emoji: "🪙" },
  { id: "savage", label: "Clear current Savage tier", note: "Loot lockout resets weekly", emoji: "⚔️" },
  { id: "raid-normal", label: "Normal raid clears", note: "Tokens for gear + weekly upgrade item", emoji: "🛡️" },
  { id: "faux", label: "Faux Hollows (Unreal)", note: "Weekly roll from the Faux Commander", emoji: "🃏" },
  { id: "wondrous", label: "Wondrous Tails", note: "Khloe — easy rewards/second chance points", emoji: "📔" },
  { id: "hunts", label: "Weekly elite Hunt marks", note: "Big tomestone + currency payout", emoji: "🎯" },
  { id: "custom", label: "Custom Deliveries", note: "Scrips + gil, low effort", emoji: "📦" },
  { id: "challenge", label: "Challenge Log", note: "Weekly bonus objectives", emoji: "📋" },
];

const STORAGE_KEY = "ea-endgame-checklist-v1";

interface Stored {
  weeklyKey: string;
  weekly: Record<string, boolean>;
}

export function Endgame({ profile }: { profile: CharacterProfile }) {
  const tier = resolveExperience(profile);
  const isMaxLevel = profile.level >= 100;
  const [state, setState] = useState<Stored | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load + auto-reset when the weekly period rolls over.
  useEffect(() => {
    const wk = weeklyKey();
    let loaded: Stored | null = null;
    try {
      loaded = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      loaded = null;
    }
    const next: Stored = {
      weeklyKey: wk,
      weekly: loaded && loaded.weeklyKey === wk ? loaded.weekly : {},
    };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [weeklyKey(now)]);

  function toggle(id: string) {
    setState((prev) => {
      if (!prev) return prev;
      const next: Stored = { ...prev, weekly: { ...prev.weekly, [id]: !prev.weekly[id] } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const done = useMemo(
    () => (state ? WEEKLY_TASKS.filter((t) => state.weekly[t.id]).length : 0),
    [state]
  );
  const pct = (done / WEEKLY_TASKS.length) * 100;

  return (
    <section className="space-y-4">
      <div>
        <h3 className="section-title">
          🔥 Endgame (100+)
          <InfoTip text="The max-level loop: tomestone gearing, the raid → savage ladder, extreme/unreal trials, relics and hunts. The weekly checklist auto-clears at the weekly reset (Tuesday 08:00 UTC)." />
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {tier === "ENDGAME"
            ? "Your max-level command center — gear faster, plan your raid week, never miss a weekly."
            : "A preview of the max-level game. Mark your Experience as ‘Endgame’ in your profile to make this your home tab."}
        </p>
      </div>

      {!isMaxLevel && (
        <div className="glass border-l-4 border-l-amber-400 p-4 text-sm text-slate-600 dark:text-slate-300">
          <strong className="text-amber-600">You're not at level 100 yet.</strong> This
          is here as a roadmap — the weekly loop below kicks in once you hit the cap.
        </div>
      )}

      {/* weekly endgame checklist */}
      <div className="glass p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗓️</span>
            <span className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">
              Weekly endgame targets
            </span>
            {done === WEEKLY_TASKS.length && (
              <span className="chip bg-emerald-100 text-emerald-700 ring-emerald-200">
                all done! 🎉
              </span>
            )}
          </div>
          <span className="chip bg-lavender-100 text-lavender-700 ring-lavender-200 dark:bg-white/10 dark:text-lavender-200">
            ⏳ Resets in {formatCountdown(nextWeeklyReset(now) - now)}
          </span>
        </div>

        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-lavender-200/50 dark:bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold-400 to-emerald-400"
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>

        <ul className="grid gap-1.5 sm:grid-cols-2">
          {WEEKLY_TASKS.map((t) => {
            const checked = !!state?.weekly[t.id];
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => toggle(t.id)}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all",
                    checked
                      ? "bg-emerald-50/70 dark:bg-emerald-500/10"
                      : "bg-white/50 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
                  )}
                >
                  <span
                    className={clsx(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition-all",
                      checked
                        ? "border-emerald-400 bg-emerald-400 text-white"
                        : "border-lavender-300 bg-white/60 dark:border-white/20 dark:bg-transparent"
                    )}
                  >
                    {checked ? "✓" : ""}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={clsx(
                        "flex items-center gap-1.5 font-semibold",
                        checked ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100"
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
        <p className="mt-2 px-1 text-[11px] text-slate-400">
          Auto-resets at the weekly reset (Tuesday 08:00 UTC). Saved on this device.
        </p>
      </div>

      {/* guidance cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {CARDS.map((c) => (
          <div key={c.title} className="glass p-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{c.emoji}</span>
              <h4 className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">
                {c.title}
              </h4>
            </div>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{c.body}</p>
            {c.steps && (
              <ul className="mt-2 space-y-1">
                {c.steps.map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-[13px] text-slate-600 dark:text-slate-300"
                  >
                    <span className="text-gold-500">▸</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
