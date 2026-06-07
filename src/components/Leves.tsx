"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { coordToPercent } from "@/lib/coords";
import { InfoTip } from "./InfoTip";
import { useMarket } from "./MarketModal";

interface Leve {
  id: number;
  name: string;
  level: number;
  type: string;
  category: string;
  zone: string;
  levemete: string | null;
  issueZone: string | null;
  mapId: number | null;
  x: number | null;
  y: number | null;
  image: string | null;
  sizeFactor: number | null;
  aetheryte: string | null;
  exp: number;
  allowance: number;
  expPerAllowance: number;
  required: {
    id: number;
    name: string;
    count: number;
    craftLevel?: number | null;
    ingredients?: { id: number; name: string; amount: number }[];
  }[];
  repeats: number;
}
interface ZoneOption { mapId: number; zone: string; aetheryte: string }

const CATEGORIES = ["All", "Battlecraft", "Tradecraft", "Fieldcraft", "Grand Company"] as const;
const CAT_STYLE: Record<string, string> = {
  Battlecraft: "bg-rose-100 text-rose-700 ring-rose-200",
  Tradecraft: "bg-amber-100 text-amber-700 ring-amber-200",
  Fieldcraft: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "Grand Company": "bg-sky-100 text-sky-700 ring-sky-200",
  Other: "bg-slate-100 text-slate-600 ring-slate-200",
};
const CAT_EMOJI: Record<string, string> = {
  Battlecraft: "⚔️",
  Tradecraft: "🔨",
  Fieldcraft: "⛏️",
  "Grand Company": "🎖️",
  Other: "📜",
};

const SPEED_TIPS: Record<string, string> = {
  Battlecraft:
    "Battle leves give modest EXP — roulettes & dungeons level faster (see the Leveling tab). Use these to farm a specific zone, item, or gil.",
  Tradecraft:
    "THE fastest crafting EXP per allowance. Take the highest-level tradecraft leve you can, craft the items (turn in 3 for a triple reward), and hand in HQ for a big bonus. Repeat with allowances.",
  Fieldcraft:
    "Decent gatherer EXP, but collectables and leve-free node grinding usually beat them. Great for targeting a specific material or quick gil.",
  "Grand Company":
    "Tied to your Grand Company. Niche — most players level faster with the other leve types or roulettes.",
};

const BRACKETS = [
  { label: "Any level", min: 1, max: 100 },
  { label: "1–20", min: 1, max: 20 },
  { label: "21–40", min: 21, max: 40 },
  { label: "41–50", min: 41, max: 50 },
  { label: "51–60", min: 51, max: 60 },
  { label: "61–70", min: 61, max: 70 },
  { label: "71–80", min: 71, max: 80 },
  { label: "81–90", min: 81, max: 90 },
  { label: "91–100", min: 91, max: 100 },
];

export function Leves() {
  const market = useMarket();
  const [leves, setLeves] = useState<Leve[]>([]);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string>("All");
  const [type, setType] = useState<string>("");
  const [bracket, setBracket] = useState(0);
  const [q, setQ] = useState("");
  const [best, setBest] = useState(false);
  const [open, setOpen] = useState<Leve | null>(null);
  const [currentMapId, setCurrentMapId] = useState<number | "">("");

  useEffect(() => {
    Promise.all([
      fetch("/leves/leves.json").then((r) => r.json()),
      fetch("/api/bestiary/zones").then((r) => r.json()).then((d) => d.zones ?? []),
    ])
      .then(([lv, zs]) => {
        setLeves(lv);
        setZones(zs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // distinct specific types within the chosen category
  const types = useMemo(() => {
    const pool = cat === "All" ? leves : leves.filter((l) => l.category === cat);
    return Array.from(new Set(pool.map((l) => l.type).filter(Boolean))).sort();
  }, [leves, cat]);

  const br = BRACKETS[bracket];
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const out = leves
      .filter((l) => (cat === "All" || l.category === cat))
      .filter((l) => (!type || l.type === type))
      .filter((l) => l.level >= br.min && l.level <= br.max)
      .filter((l) => !ql || l.name.toLowerCase().includes(ql) || (l.levemete ?? "").toLowerCase().includes(ql));
    if (best) {
      return [...out].sort((a, b) => b.expPerAllowance - a.expPerAllowance || a.level - b.level);
    }
    return out;
  }, [leves, cat, type, br, q, best]);

  return (
    <section className="space-y-3">
      <h3 className="section-title">
        📜 Levequests (Leves)
        <InfoTip text="Repeatable quests you pick up from a Levemete (📜) for EXP, gil and items. You get 3 allowances every 12 hours (03:00 & 15:00 your local server reset is daily; leve allowances refill twice daily), stacking up to 100. Unlocks around level 10 via the main story." />
      </h3>

      {/* explainer */}
      <div className="glass p-4 text-sm text-slate-600 dark:text-slate-300">
        <p>
          <strong>What are leves?</strong> Repeatable side quests from{" "}
          <strong>Levemetes</strong>. Spend a <strong>leve allowance</strong> (you get 3 every
          12 hours, up to 100 stored) to accept one, finish the objective, and turn it in for
          EXP, gil and sometimes items. There are four kinds:
        </p>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <span>⚔️ <strong>Battlecraft</strong> — combat (DoW/DoM)</span>
          <span>🔨 <strong>Tradecraft</strong> — crafting (per craft job)</span>
          <span>⛏️ <strong>Fieldcraft</strong> — gathering (MIN/BTN/FSH)</span>
          <span>🎖️ <strong>Grand Company</strong> — GC-tied leves</span>
        </div>
      </div>

      {/* filters */}
      <div className="glass space-y-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCat(c); setType(""); }}
              className={clsx(
                "rounded-2xl px-3 py-1.5 text-xs font-semibold transition",
                cat === c
                  ? "bg-gradient-to-r from-lavender-500 to-lavender-400 text-white shadow-soft"
                  : "bg-white/60 text-slate-600 ring-1 ring-inset ring-lavender-200/70 hover:bg-white dark:bg-white/5 dark:text-slate-200 dark:ring-white/10"
              )}
            >
              {c === "All" ? "✨ All" : `${CAT_EMOJI[c]} ${c}`}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All disciplines</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="field" value={bracket} onChange={(e) => setBracket(Number(e.target.value))}>
            {BRACKETS.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}
          </select>
          <input className="field" placeholder="Search leve or levemete…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button
          onClick={() => setBest((b) => !b)}
          className={clsx(
            "flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold transition",
            best
              ? "bg-gradient-to-r from-gold-400 to-gold-300 text-gold-900 shadow-soft"
              : "bg-white/60 text-slate-600 ring-1 ring-inset ring-lavender-200/70 hover:bg-white dark:bg-white/5 dark:text-slate-200 dark:ring-white/10"
          )}
        >
          ⭐ Best for leveling{best ? " · on" : ""}
          <InfoTip text="Sorts your filtered leves by the most EXP per allowance (real reward data). The ⭐ picks are the most efficient leves to spend allowances on for leveling." />
        </button>
        {cat !== "All" && (
          <p className="rounded-2xl bg-lavender-100/50 px-3 py-2 text-xs text-lavender-700 dark:bg-white/5 dark:text-lavender-200">
            💡 {SPEED_TIPS[cat]}
          </p>
        )}
      </div>

      {/* detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass space-y-3 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{CAT_EMOJI[open.category]}</span>
                  <h4 className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">{open.name}</h4>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className={clsx("chip", CAT_STYLE[open.category])}>{open.type || open.category}</span>
                  <span className="chip bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/10 dark:text-slate-200">Lv {open.level}</span>
                  {open.exp > 0 && (
                    <span className="chip bg-gold-300/40 text-gold-600 ring-gold-300/60">
                      ✨ {open.exp.toLocaleString()} EXP{open.allowance > 1 ? ` · ${open.allowance} allowances` : ""}
                    </span>
                  )}
                  {open.zone && <span className="chip bg-lavender-100 text-lavender-700 ring-lavender-200 dark:bg-white/10 dark:text-lavender-200">do it in {open.zone}</span>}
                </div>
              </div>
              <button onClick={() => setOpen(null)} className="btn-ghost !px-3 !py-1.5">← Back</button>
            </div>

            {/* what to bring / buy */}
            {open.required.length > 0 && (
              <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-3 dark:border-amber-400/20 dark:bg-amber-500/10">
                <div className="flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-300">
                  📦 Bring / turn in
                  <InfoTip text="Tradecraft leves require you to hand in crafted item(s). Craft them yourself, or buy them (or their materials) on the Market Board — tap a item to see live prices in-app." />
                </div>
                <ul className="mt-2 space-y-2">
                  {open.required.map((r) => (
                    <li key={r.id} className="rounded-xl bg-white/60 px-3 py-2 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          🛠️ Craft {r.count}× {r.name}
                          {r.craftLevel ? (
                            <span className="ml-1 text-[11px] font-normal text-amber-700/80 dark:text-amber-300/80">
                              (craftable at Lv {r.craftLevel})
                            </span>
                          ) : null}
                        </span>
                        <button
                          onClick={() => market.openItem(r.id, r.name)}
                          className="shrink-0 rounded-lg bg-lavender-100 px-2.5 py-1 text-[11px] font-semibold text-lavender-700 ring-1 ring-inset ring-lavender-200 hover:bg-lavender-200 dark:bg-white/10 dark:text-lavender-200 dark:ring-white/10"
                        >
                          🔎 buy finished
                        </button>
                      </div>
                      {r.ingredients && r.ingredients.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-amber-700/80 dark:text-amber-300/80">Materials:</span>
                          {r.ingredients.map((g) => (
                            <button
                              key={g.id}
                              onClick={() => market.openItem(g.id, g.name)}
                              title="See Market Board price"
                              className="rounded-lg bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-lavender-200/70 hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:ring-white/10"
                            >
                              {g.amount}× {g.name} 🔎
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-amber-700/80 dark:text-amber-300/80">
                  {open.repeats > 0
                    ? `Tip: this leve is repeatable — turn in up to ${open.repeats + 1}× (bring ${open.repeats + 1}× the items) for a big EXP bonus.`
                    : "Craft it yourself, or buy it on the Market Board, then hand it to the levemete."}
                </p>
              </div>
            )}

            {open.image && open.x != null && open.y != null ? (
              <LeveMap leve={open} />
            ) : (
              <p className="text-sm text-slate-500">Issuer location unavailable for this leve.</p>
            )}

            {/* travel */}
            {open.mapId != null && (
              <div className="rounded-2xl bg-gradient-to-br from-lavender-100/70 to-cream-100/60 p-4 dark:from-white/[0.05] dark:to-white/[0.02]">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-lavender-600/80 dark:text-lavender-300/70">
                  🗺️ How to get there <InfoTip text="Leves are picked up from the Levemete (📜). Teleport to the nearest aetheryte and talk to them." />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="text-sm text-slate-600 dark:text-slate-300">Where are you?</label>
                  <select className="field sm:max-w-xs" value={currentMapId} onChange={(e) => setCurrentMapId(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">Select your current zone…</option>
                    {zones.map((z) => <option key={z.mapId} value={z.mapId}>{z.zone}</option>)}
                  </select>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-100">
                  {currentMapId !== "" && Number(currentMapId) === open.mapId
                    ? `✅ You're in ${open.issueZone}! Talk to the levemete ${open.levemete} at (X: ${open.x}, Y: ${open.y}).`
                    : open.aetheryte
                    ? `🔮 Teleport to the ${open.aetheryte} aetheryte in ${open.issueZone}, then talk to ${open.levemete} at (X: ${open.x}, Y: ${open.y}).`
                    : `🧭 Head to ${open.issueZone} and talk to ${open.levemete} at (X: ${open.x}, Y: ${open.y}).`}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* list */}
      <div className="glass p-2">
        {loading ? (
          <div className="space-y-1.5 p-2">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-12 rounded-xl bg-lavender-200/30" />)}
          </div>
        ) : (
          <>
            <div className="px-2 py-1 text-xs text-slate-400">
              {filtered.length.toLocaleString()} leve{filtered.length === 1 ? "" : "s"} · showing first {Math.min(filtered.length, 80)}
            </div>
            <ul className="max-h-[28rem] space-y-1 overflow-auto pr-1">
              {filtered.slice(0, 80).map((l, i) => (
                <li key={l.id}>
                  <button
                    onClick={() => { setOpen(l); setCurrentMapId(""); }}
                    className="flex w-full items-center gap-3 rounded-xl bg-white/50 px-3 py-2 text-left transition hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-lavender-100 text-sm font-bold text-lavender-700 dark:bg-white/10 dark:text-lavender-200">
                      {l.level}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {best && i < 3 && <span title="Top pick">⭐</span>}
                        {l.name}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {l.levemete ? `${l.levemete} · ${l.issueZone}` : l.zone}
                        {l.exp > 0 ? ` · ✨ ${l.expPerAllowance.toLocaleString()} EXP/allowance` : ""}
                      </span>
                    </span>
                    <span className={clsx("chip shrink-0", CAT_STYLE[l.category])}>{CAT_EMOJI[l.category]} {l.type || l.category}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-400">No leves match those filters.</li>}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function LeveMap({ leve }: { leve: Leve }) {
  const left = coordToPercent(leve.x as number, leve.sizeFactor || 100);
  const top = coordToPercent(leve.y as number, leve.sizeFactor || 100);
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{leve.issueZone}</div>
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-inset ring-lavender-200/60 dark:ring-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={leve.image as string} alt={`${leve.issueZone} map`} className="block aspect-square w-full object-cover" loading="lazy" />
        <div className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%`, top: `${top}%` }}>
          <span className="relative flex h-5 w-5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/60" />
            <span className="relative text-base drop-shadow">📜</span>
          </span>
          <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900/85 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            {leve.levemete} ({leve.x}, {leve.y})
          </span>
        </div>
      </div>
    </div>
  );
}
