"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type { AdvisorResult, CharacterProfile, GearItem, Goal } from "@/lib/types";
import { GearAdvisor } from "./GearAdvisor";
import { MarketTax } from "./MarketTax";
import { MarketBoard } from "./MarketBoard";
import { MarketSettings } from "./MarketSettings";
import { DailyChecklist } from "./DailyChecklist";
import { Locator } from "./Locator";
import { InfoTip } from "./InfoTip";
import {
  FoodReminder,
  GilWarnings,
  LevelingRoute,
  LuxurySuggestions,
  QueueAdvisor,
} from "./AdviceSections";

type TabId =
  | "all"
  | "dailies"
  | "locator"
  | "gear"
  | "leveling"
  | "market"
  | "food"
  | "gil"
  | "luxury";

interface Section {
  id: Exclude<TabId, "all">;
  label: string;
  emoji: string;
  blurb: string; // one friendly line for novices
  keywords: string[];
  node: React.ReactNode;
}

// Which section a novice most likely wants first, based on their goal.
const GOAL_DEFAULT_TAB: Record<Goal, TabId> = {
  SPEED_LEVELING: "leveling",
  GEAR_UPGRADE: "gear",
  GLAMOUR: "luxury",
  MOUNT_SHOPPING: "luxury",
  GIL_SAVING: "gil",
  FRESH_RETURNER: "leveling",
  WHAT_NEXT: "leveling",
};

// Quick novice questions → jump to the right tab.
const QUICK_QUESTIONS: { q: string; tab: TabId }[] = [
  { q: "What are my dailies?", tab: "dailies" },
  { q: "Where do I find a monster?", tab: "locator" },
  { q: "What gear should I buy?", tab: "gear" },
  { q: "What should I run next?", tab: "leveling" },
  { q: "How do I save gil?", tab: "gil" },
  { q: "What food do I eat?", tab: "food" },
  { q: "Where’s cheapest to sell?", tab: "market" },
  { q: "Show me glam & mounts", tab: "luxury" },
];

export function Dashboard({
  profile,
  gear,
  advice,
}: {
  profile: CharacterProfile;
  gear: GearItem[];
  advice: AdvisorResult;
}) {
  const [tab, setTab] = useState<TabId>(GOAL_DEFAULT_TAB[profile.goal] ?? "leveling");
  const [query, setQuery] = useState("");

  const sections: Section[] = useMemo(
    () => [
      {
        id: "dailies",
        label: "Dailies",
        emoji: "✅",
        blurb: "Check off your daily & weekly tasks — auto-resets on FFXIV reset.",
        keywords: ["daily", "dailies", "weekly", "checklist", "reset", "roulette", "todo", "task", "wondrous", "challenge"],
        node: <DailyChecklist profile={profile} advice={advice} />,
      },
      {
        id: "locator",
        label: "Locator",
        emoji: "🧭",
        blurb: "Find any monster, NPC or vendor on the map — with travel directions.",
        keywords: ["monster", "mob", "npc", "vendor", "where", "find", "location", "map", "spawn", "travel", "aetheryte", "teleport", "locate"],
        node: <Locator />,
      },
      {
        id: "gear",
        label: "Gear",
        emoji: "🛡️",
        blurb: "What to buy, skip, or grab from dungeons — with live prices.",
        keywords: ["gear", "weapon", "armor", "item level", "ilvl", "upgrade", "buy", "hq", "slot", "accessory", "ring"],
        node: <GearAdvisor profile={profile} equipped={gear} />,
      },
      {
        id: "leveling",
        label: "Leveling",
        emoji: "🎲",
        blurb: "Which roulette and dungeon to run, and your route up.",
        keywords: ["level", "leveling", "roulette", "dungeon", "queue", "exp", "route", "run", "daily", "duty", "trial", "wondrous"],
        node: (
          <div className="space-y-6">
            <QueueAdvisor queue={advice.queue} />
            <LevelingRoute route={advice.route} />
          </div>
        ),
      },
      {
        id: "market",
        label: "Market",
        emoji: "💰",
        blurb: "Search any item for live prices, plus the cheapest city to sell in.",
        keywords: ["market", "tax", "goblin", "board", "sell", "retainer", "city", "price", "universalis", "search", "listing", "item"],
        node: (
          <div className="space-y-6">
            <MarketSettings />
            <MarketBoard />
            <MarketTax />
          </div>
        ),
      },
      {
        id: "food",
        label: "Food",
        emoji: "🍳",
        blurb: "Cheap food to keep your EXP buff rolling.",
        keywords: ["food", "exp buff", "well fed", "eat", "cooking", "meal", "buff"],
        node: <FoodReminder food={advice.food} />,
      },
      {
        id: "gil",
        label: "Gil tips",
        emoji: "🪙",
        blurb: "Money traps to dodge and where not to overspend.",
        keywords: ["gil", "money", "save", "warning", "trap", "budget", "expensive", "cost"],
        node: <GilWarnings warnings={advice.gilWarnings} />,
      },
      {
        id: "luxury",
        label: "Glam & Mounts",
        emoji: "💎",
        blurb: "Fun stuff: glamour, dyes, mounts and minions.",
        keywords: ["glamour", "glam", "mount", "minion", "luxury", "cosmetic", "flex", "fashion", "dye"],
        node: <LuxurySuggestions luxury={advice.luxury} />,
      },
    ],
    [profile, gear, advice]
  );

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const visible = useMemo(() => {
    if (searching) {
      return sections.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.blurb.toLowerCase().includes(q) ||
          s.keywords.some((k) => k.includes(q) || q.includes(k))
      );
    }
    if (tab === "all") return sections;
    return sections.filter((s) => s.id === tab);
  }, [sections, q, searching, tab]);

  const tabs: { id: TabId; label: string; emoji: string }[] = [
    { id: "all", label: "Everything", emoji: "✨" },
    ...sections.map((s) => ({ id: s.id as TabId, label: s.label, emoji: s.emoji })),
  ];

  const activeSection = !searching && tab !== "all" ? sections.find((s) => s.id === tab) : null;

  return (
    <div className="space-y-5">
      {/* search bar */}
      <div className="glass p-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-lavender-500/70 dark:text-lavender-300/60">
          Find what you need
          <InfoTip text="Type what you're after (gear, roulette, food, gil, mounts…) to jump straight to it, or use the tabs below. New here? Try the quick questions." />
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
            🔎
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to do? (try “gear”, “roulette”, “save gil”, “mounts”…)"
            className="field !rounded-2xl !py-3 !pl-11 text-base"
          />
          {searching && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* quick novice questions */}
        {!searching && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {QUICK_QUESTIONS.map((qq) => (
              <button
                key={qq.q}
                onClick={() => setTab(qq.tab)}
                className="rounded-full bg-lavender-100/70 px-3 py-1 text-xs font-semibold text-lavender-700 ring-1 ring-inset ring-lavender-200 transition hover:bg-lavender-200 dark:bg-white/5 dark:text-lavender-200 dark:ring-white/10"
              >
                {qq.q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* tab pills (hidden while searching) */}
      {!searching && (
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-sm font-semibold transition-all",
                tab === t.id
                  ? "bg-gradient-to-r from-lavender-500 to-lavender-400 text-white shadow-soft"
                  : "bg-white/60 text-slate-600 ring-1 ring-inset ring-lavender-200/70 hover:bg-white dark:bg-white/5 dark:text-slate-200 dark:ring-white/10"
              )}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* helper line for the active tab */}
      {activeSection && (
        <p className="px-1 text-sm text-slate-500 dark:text-slate-400">
          {activeSection.emoji} {activeSection.blurb}
        </p>
      )}
      {searching && (
        <p className="px-1 text-sm text-slate-500 dark:text-slate-400">
          {visible.length
            ? `Showing ${visible.length} result${visible.length > 1 ? "s" : ""} for “${query}”`
            : `No matches for “${query}” — try “gear”, “roulette”, “food”, “tax”, “mount”.`}
        </p>
      )}

      {/* sections */}
      <AnimatePresence mode="wait">
        <motion.div
          key={searching ? `q:${q}` : tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {visible.map((s) => (
            <div key={s.id}>{s.node}</div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
