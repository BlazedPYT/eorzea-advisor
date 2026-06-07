"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  CRAFT_JOBS,
  GATHER_JOBS,
  getDiscipline,
  methodsFor,
  bestMethodAt,
  tipsFor,
} from "@/lib/crafting";
import { InfoTip } from "./InfoTip";
import { useMarket } from "./MarketModal";

interface LeveLite {
  name: string;
  level: number;
  type: string;
  levemete: string | null;
  issueZone: string | null;
  required: {
    id: number;
    name: string;
    count: number;
    craftLevel?: number | null;
    ingredients?: { id: number; name: string; amount: number }[];
  }[];
}

// The level you can actually craft a leve's turn-in item (falls back to the
// leve's pickup level when no recipe level is known).
const craftLvlOf = (l: LeveLite) => l.required[0]?.craftLevel || l.level;

export function Crafting() {
  const market = useMarket();
  const [jobId, setJobId] = useState("CUL");
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState<number[]>([]);
  const [leves, setLeves] = useState<LeveLite[]>([]);
  const [matMin, setMatMin] = useState(1);
  const [matMax, setMatMax] = useState(50);
  const [perLeve, setPerLeve] = useState(1);

  useEffect(() => {
    fetch("/crafting/exp.json").then((r) => r.json()).then(setExp).catch(() => {});
    fetch("/leves/leves.json").then((r) => r.json()).then(setLeves).catch(() => {});
  }, []);

  const job = getDiscipline(jobId)!;
  const methods = methodsFor(job.type);
  const best = bestMethodAt(job.type, level);
  const tips = tipsFor(job.type);
  const expToNext = exp[level] ?? 0;

  const otherMethods = useMemo(
    () => methods.filter((m) => level >= m.min && level <= m.max && m !== best),
    [methods, level, best]
  );

  // Craft-by-level route: one representative tradecraft leve per level tier for
  // this crafter, with the item to craft + its materials (Market Board links).
  const craftRoute = useMemo(() => {
    if (job.type !== "DoH") return [];
    const mine = leves
      .filter((l) => l.type === job.name && l.required.length > 0)
      .sort((a, b) => craftLvlOf(a) - craftLvlOf(b));
    // one representative per *craft* level (the level you can actually make it)
    const byLevel = new Map<number, LeveLite>();
    for (const l of mine) {
      const cl = craftLvlOf(l);
      if (!byLevel.has(cl)) byLevel.set(cl, l);
    }
    return Array.from(byLevel.values()).sort((a, b) => craftLvlOf(a) - craftLvlOf(b));
  }, [leves, job]);

  // Aggregated shopping list: total materials to craft the recommended leve
  // items across the selected level range (× how many times you do each leve).
  const matTotals = useMemo(() => {
    const mats = new Map<number, { name: string; qty: number }>();
    const crystals = new Map<number, { name: string; qty: number }>();
    let crafts = 0;
    for (const l of craftRoute) {
      const cl = craftLvlOf(l);
      if (cl < matMin || cl > matMax) continue;
      for (const r of l.required) {
        crafts += 1;
        const times = (r.count || 1) * perLeve;
        for (const g of r.ingredients || []) {
          const bucket = g.id < 20 ? crystals : mats; // ids 2–19 are shards/crystals/clusters
          const cur = bucket.get(g.id) || { name: g.name, qty: 0 };
          cur.qty += g.amount * times;
          bucket.set(g.id, cur);
        }
      }
    }
    const toArr = (m: Map<number, { name: string; qty: number }>) =>
      Array.from(m.entries())
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => a.name.localeCompare(b.name));
    return { mats: toArr(mats), crystals: toArr(crystals), crafts };
  }, [craftRoute, matMin, matMax, perLeve]);

  return (
    <section className="space-y-3">
      <h3 className="section-title">
        🔨 Crafting &amp; Gathering
        <InfoTip text="Level any of the 8 crafting (Disciple of the Hand) or 3 gathering (Disciple of the Land) jobs. Pick a job and your level to see what to do next, the fastest method, and how much EXP the next level needs." />
      </h3>

      {/* job picker */}
      <div className="glass space-y-3 p-4">
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-lavender-500/70 dark:text-lavender-300/60">
            Disciples of the Hand (crafters)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CRAFT_JOBS.map((j) => (
              <JobChip key={j.id} j={j} active={j.id === jobId} onClick={() => setJobId(j.id)} />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-lavender-500/70 dark:text-lavender-300/60">
            Disciples of the Land (gatherers)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GATHER_JOBS.map((j) => (
              <JobChip key={j.id} j={j} active={j.id === jobId} onClick={() => setJobId(j.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* job summary + level */}
      <div className="glass p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
              style={{ background: `${job.color}33` }}
            >
              {job.emoji}
            </span>
            <div>
              <div className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">
                {job.name} <span className="text-sm text-slate-400">({job.abbr})</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Makes {job.makes} · guild in <strong>{job.guild}</strong>
              </div>
            </div>
          </div>
          <span className="chip bg-lavender-100 text-lavender-700 ring-lavender-200 dark:bg-white/10 dark:text-lavender-200">
            {job.type === "DoH" ? "Disciple of the Hand" : "Disciple of the Land"}
          </span>
        </div>

        {/* level slider */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <label className="label !mb-0">
              Current {job.abbr} level{" "}
              <InfoTip text="Each crafting/gathering job levels separately. Set this job's level to see the next-level requirement and the best method right now." />
            </label>
            <span className="font-display text-xl font-bold text-slate-800 dark:text-slate-100">Lv {level}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full accent-lavender-500"
            style={{ background: `linear-gradient(to right,#8b66e0 ${level}%,rgba(167,139,234,.25) ${level}%)` }}
          />
          <div className="mt-1 flex flex-wrap gap-1.5">
            {[1, 20, 40, 50, 60, 70, 80, 90, 100].map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className="rounded-lg bg-white/60 px-2 py-0.5 text-[11px] font-semibold text-lavender-700 ring-1 ring-inset ring-lavender-200 hover:bg-white dark:bg-white/5 dark:text-lavender-200 dark:ring-white/10"
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* next-level requirement */}
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-cream-100/80 to-lavender-100/60 p-3 dark:from-white/[0.04] dark:to-white/[0.02]">
          {level >= 100 ? (
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">
              🎉 Level 100 — this job is maxed! Now chase Master recipes, scrips and gear.
            </span>
          ) : (
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">
              ➡️ EXP to reach level {level + 1}:{" "}
              <span className="font-display text-gold-600">{expToNext ? expToNext.toLocaleString() : "…"}</span> EXP
            </span>
          )}
        </div>
      </div>

      {/* recommended next step */}
      {best && level < 100 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass border-l-4 border-l-emerald-400 p-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">⭐ Best method right now (Lv {level})</div>
          <div className="mt-1 font-display text-lg font-bold text-slate-800 dark:text-slate-100">{best.name}</div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{best.detail}</p>
        </motion.div>
      )}

      {/* total materials for a level range (shopping list) */}
      {craftRoute.length > 0 && (
        <div className="glass p-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
            🧾 Total materials for a level range
            <InfoTip text="Adds up every material needed to craft the recommended leve items across the levels you choose — a ready shopping list. Tap any material to see its live Market Board price. Crystals/shards are listed separately." />
          </h4>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-300">Levels</span>
            <select className="field !w-auto" value={matMin} onChange={(e) => setMatMin(Number(e.target.value))}>
              {Array.from({ length: 100 }, (_, i) => i + 1).map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <span className="text-slate-400">→</span>
            <select className="field !w-auto" value={matMax} onChange={(e) => setMatMax(Number(e.target.value))}>
              {Array.from({ length: 100 }, (_, i) => i + 1).map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <span className="ml-2 flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
              craft each ×
              <select className="field !w-auto" value={perLeve} onChange={(e) => setPerLeve(Number(e.target.value))}>
                {[1, 2, 3, 5, 10].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <InfoTip text="How many times you'll do each leve (you usually repeat them while leveling). Multiplies the whole shopping list." />
            </span>
          </div>

          {matTotals.mats.length === 0 ? (
            <p className="text-sm text-slate-400">No craftable leves in this range for {job.name}.</p>
          ) : (
            <>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-lavender-500/70">
                Materials ({matTotals.mats.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matTotals.mats.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => market.openItem(g.id, g.name)}
                    className="rounded-lg bg-white/60 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-lavender-200/70 hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:ring-white/10"
                  >
                    <span className="text-gold-600">{g.qty}×</span> {g.name} 🔎
                  </button>
                ))}
              </div>
              {matTotals.crystals.length > 0 && (
                <>
                  <div className="mb-1 mt-3 text-[11px] font-bold uppercase tracking-wide text-lavender-500/70">
                    Crystals &amp; shards
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matTotals.crystals.map((g) => (
                      <span key={g.id} className="rounded-lg bg-sky-100/70 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-white/10 dark:text-sky-200">
                        {g.qty}× {g.name}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <p className="mt-2 text-[11px] text-slate-400">
                Covers the recommended leve craft at each level from {matMin} to {matMax}. Adjust the multiplier for how many times you repeat each leve.
              </p>
            </>
          )}
        </div>
      )}

      {/* craft-by-level route (DoH) */}
      {craftRoute.length > 0 && (
        <div className="glass p-4">
          <h4 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
            🧑‍🍳 Craft-by-level route for {job.name}
            <InfoTip text="The fastest path: at each level, craft the leve turn-in item and hand it to the levemete (triple turn-in HQ when possible). Tap the item or a material to see live Market Board prices — craft them or buy them." />
          </h4>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            At each level, craft the item below and turn it in as a levequest (see the Leves tab
            for the issuer + map). Tap any item/material for live Market Board prices.
          </p>
          <ol className="relative space-y-3 border-l-2 border-lavender-200/70 pl-5 dark:border-white/10">
            {craftRoute.map((l) => {
              const r = l.required[0];
              const lv = craftLvlOf(l); // level you can actually craft it
              const done = level > lv + 4;
              const here = level >= lv && level <= lv + 4;
              return (
                <li key={lv} className="relative">
                  <span className={clsx("absolute -left-[30px] grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold", done ? "bg-emerald-400 text-white" : here ? "bg-gold-400 text-gold-900" : "bg-lavender-400 text-white")}>
                    {done ? "✓" : lv}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip bg-lavender-100 text-lavender-700 ring-lavender-200 dark:bg-white/10 dark:text-lavender-200">Lv {lv}</span>
                    <button
                      onClick={() => market.openItem(r.id, r.name)}
                      className="font-semibold text-slate-800 underline-offset-2 hover:underline dark:text-slate-100"
                    >
                      🛠️ Craft {r.count}× {r.name} 🔎
                    </button>
                    {here && <span className="chip bg-gold-300/40 text-gold-600 ring-gold-300/60">do this now</span>}
                  </div>
                  {r.ingredients && r.ingredients.length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-400">mats:</span>
                      {r.ingredients.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => market.openItem(g.id, g.name)}
                          className="rounded-lg bg-white/60 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-lavender-200/70 hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:ring-white/10"
                        >
                          {g.amount}× {g.name} 🔎
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    turn in to {l.levemete} · {l.issueZone}
                    {l.level !== lv ? ` · from the Lv ${l.level} leve` : ""}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* other methods available now */}
      {otherMethods.length > 0 && (
        <div className="space-y-2">
          <h4 className="px-1 text-sm font-bold text-slate-700 dark:text-slate-200">Also good at Lv {level}</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {otherMethods.map((m) => (
              <div key={m.name} className="glass p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{m.name}</span>
                  <span className="chip bg-slate-100 text-slate-500 ring-slate-200 dark:bg-white/10 dark:text-slate-300">
                    Lv {m.min}–{m.max}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{m.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* full route timeline */}
      <div className="glass p-4">
        <h4 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
          🗺️ Full {job.abbr} leveling route
          <InfoTip text="Every method and the level range it's good for. Combine them: always do class quests + the best method for your tier, topped up with dailies." />
        </h4>
        <ol className="relative space-y-3 border-l-2 border-lavender-200/70 pl-5 dark:border-white/10">
          {methods.map((m, i) => {
            const activeNow = level >= m.min && level <= m.max;
            return (
              <li key={i} className="relative">
                <span className={clsx("absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold", activeNow ? "bg-emerald-400 text-white" : "bg-lavender-300 text-white")}>
                  {m.best ? "⭐" : "·"}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={clsx("font-semibold", activeNow ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400")}>{m.name}</span>
                  <span className="chip bg-lavender-100 text-lavender-700 ring-lavender-200 dark:bg-white/10 dark:text-lavender-200">Lv {m.min}–{m.max}</span>
                  {activeNow && <span className="chip bg-emerald-100 text-emerald-700 ring-emerald-200">available now</span>}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{m.detail}</p>
              </li>
            );
          })}
        </ol>
      </div>

      {/* noob tips */}
      <div className="glass p-4">
        <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
          🐣 New to {job.type === "DoH" ? "crafting" : "gathering"}? Read this
          <InfoTip text="The essentials so you don't waste time or gil while leveling this discipline." />
        </h4>
        <ul className="space-y-1.5">
          {tips.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="text-emerald-500">✓</span> {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function JobChip({ j, active, onClick }: { j: { id: string; name: string; emoji: string }; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset transition-all",
        active
          ? "bg-gradient-to-r from-lavender-500 to-lavender-400 text-white ring-transparent shadow-soft"
          : "bg-white/70 text-slate-600 ring-lavender-200/70 hover:bg-white dark:bg-white/5 dark:text-slate-200 dark:ring-white/10"
      )}
    >
      <span>{j.emoji}</span> {j.name}
    </button>
  );
}
