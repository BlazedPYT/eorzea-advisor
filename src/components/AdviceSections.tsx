"use client";

import { motion } from "framer-motion";
import type { AdvisorResult } from "@/lib/types";
import { useMarket } from "./MarketModal";
import { InfoTip } from "./InfoTip";

const PRIORITY_STYLE: Record<string, string> = {
  PRIMARY: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  SECONDARY: "bg-sky-100 text-sky-700 ring-sky-200",
  OPTIONAL: "bg-slate-100 text-slate-500 ring-slate-200",
};

function Card({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      className="glass glass-hover p-4"
    >
      {children}
    </motion.div>
  );
}

export function QueueAdvisor({ queue }: { queue: AdvisorResult["queue"] }) {
  return (
    <section className="space-y-3">
      <h3 className="section-title">
        🎲 Queue recommendations
        <InfoTip text="What to queue from the Duty Finder for the fastest EXP. Always do your Daily Leveling Roulette first, then spam the highest dungeon. Open the Duty Finder in-game with the blue cross-shaped icon, or press the Duty menu." />
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {queue.map((q, i) => (
          <Card key={i} delay={i * 0.04}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{q.icon}</span>
                <span className="font-display font-bold text-slate-800 dark:text-slate-100">
                  {q.title}
                </span>
              </div>
              <span
                className={`chip ${PRIORITY_STYLE[q.priority]} dark:bg-white/10 dark:text-slate-200`}
              >
                {q.priority.toLowerCase()}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {q.detail}
            </p>
            {!q.unlocked && (
              <p className="mt-1 text-[11px] font-semibold text-amber-600">
                🔓 unlock this first
              </p>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}

export function LevelingRoute({ route }: { route: AdvisorResult["route"] }) {
  if (!route.length) return null;
  return (
    <section className="space-y-3">
      <h3 className="section-title">
        🗺️ Leveling route
        <InfoTip text="The dungeons to run in order as you level up. ✓ means you've out-leveled it. Each unlocks from its level — pick it up from the quest NPC, then it appears in the Duty Finder." />
      </h3>
      <div className="glass p-4">
        <ol className="relative space-y-3 border-l-2 border-lavender-200/70 pl-5 dark:border-white/10">
          {route.map((step, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              <span
                className={`absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                  step.done
                    ? "bg-emerald-400 text-white"
                    : "bg-lavender-400 text-white"
                }`}
              >
                {step.done ? "✓" : step.level}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`font-semibold ${
                    step.done
                      ? "text-slate-400 line-through"
                      : "text-slate-800 dark:text-slate-100"
                  }`}
                >
                  {step.name}
                </span>
                <span className="chip bg-lavender-100 text-lavender-700 ring-lavender-200 dark:bg-white/10 dark:text-lavender-200">
                  Lv {step.level}
                </span>
                {step.note && (
                  <span className="text-[11px] text-slate-400">{step.note}</span>
                )}
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function FoodReminder({ food }: { food: AdvisorResult["food"] }) {
  const market = useMarket();
  return (
    <section className="space-y-3">
      <h3 className="section-title">
        🍳 Food buff reminder
        <InfoTip text="Eating food gives a +3% EXP 'Well Fed' buff for 30 minutes. While leveling, the exact food barely matters — just keep it active. Tap any food to see live prices. Right-click food in your inventory to eat it." />
      </h3>
      <div className="glass p-4">
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
          While leveling, the exact food stats barely matter — just{" "}
          <strong>keep the +3% EXP “Well Fed” buff active</strong>. Buy the cheapest
          food you can and re-apply it before each pull.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {food.map((f, i) => (
            <button
              key={i}
              type="button"
              onClick={() => market.openByName(f.marketSearch)}
              className="glass-hover rounded-2xl bg-white/50 p-3 text-left dark:bg-white/5"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🍴</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {f.name}
                </span>
                <span className="ml-auto text-[11px] font-semibold text-lavender-500">
                  see prices →
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{f.note}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const SEVERITY_STYLE: Record<string, string> = {
  INFO: "border-l-sky-400",
  WARN: "border-l-amber-400",
  DANGER: "border-l-rose-400",
};

export function GilWarnings({ warnings }: { warnings: AdvisorResult["gilWarnings"] }) {
  return (
    <section className="space-y-3">
      <h3 className="section-title">
        🪙 Gil-saving warnings
        <InfoTip text="Common ways new players waste gil — and what to do instead. The golden rule while leveling: don't buy gear you'll replace in a few levels; take dungeon drops and tomestone gear instead." />
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {warnings.map((w, i) => (
          <Card key={i} delay={i * 0.04}>
            <div className={`border-l-4 pl-3 ${SEVERITY_STYLE[w.severity]}`}>
              <div className="font-bold text-slate-800 dark:text-slate-100">
                {w.title}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {w.detail}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

const TAG_EMOJI: Record<string, string> = { GLAM: "✨", MOUNT: "🐎", FLEX: "💎" };

export function LuxurySuggestions({ luxury }: { luxury: AdvisorResult["luxury"] }) {
  return (
    <section className="space-y-3">
      <h3 className="section-title">
        💎 Luxury · glam · mount
        <InfoTip text="Fun ways to spend gil once you're comfortable: glamour (cosmetic gear looks via the Glamour Dresser), dyes, mounts and minions. None of this affects power — it's pure self-expression." />
      </h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {luxury.map((l, i) => (
          <Card key={i} delay={i * 0.04}>
            <div className="text-2xl">{TAG_EMOJI[l.tag]}</div>
            <div className="mt-1 font-display font-bold text-slate-800 dark:text-slate-100">
              {l.title}
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{l.detail}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
