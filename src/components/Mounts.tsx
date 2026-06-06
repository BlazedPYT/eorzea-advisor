"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { InfoTip } from "./InfoTip";

interface Source { type: string; text: string }
interface Coll {
  id: number;
  name: string;
  icon: string | null;
  image: string | null;
  sources: Source[];
  tradeable: boolean;
  patch: string;
  description: string;
}

// Colour per source type so "how to obtain" reads at a glance.
const SRC_STYLE: Record<string, string> = {
  Trial: "bg-rose-100 text-rose-700 ring-rose-200",
  Raid: "bg-rose-100 text-rose-700 ring-rose-200",
  "Chaotic Raid": "bg-rose-100 text-rose-700 ring-rose-200",
  Achievement: "bg-gold-300/40 text-gold-600 ring-gold-300/60",
  PvP: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  FATE: "bg-orange-100 text-orange-700 ring-orange-200",
  Hunts: "bg-orange-100 text-orange-700 ring-orange-200",
  "Treasure Hunt": "bg-amber-100 text-amber-700 ring-amber-200",
  Quest: "bg-sky-100 text-sky-700 ring-sky-200",
  Event: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200",
  Premium: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200",
  Tribal: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  Gathering: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  Crafting: "bg-amber-100 text-amber-700 ring-amber-200",
};
function srcStyle(t: string) {
  return SRC_STYLE[t] ?? "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/10 dark:text-slate-200";
}

export function Mounts() {
  const [kind, setKind] = useState<"mounts" | "minions">("mounts");
  const [cache, setCache] = useState<Record<string, Coll[]>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (cache[kind]) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/mounts/${kind}.json`)
      .then((r) => r.json())
      .then((d: Coll[]) => setCache((c) => ({ ...c, [kind]: d })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [kind, cache]);

  const data = cache[kind] ?? [];

  const sourceTypes = useMemo(() => {
    const s = new Set<string>();
    for (const m of data) for (const so of m.sources) s.add(so.type);
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return data.filter(
      (m) =>
        (!ql || m.name.toLowerCase().includes(ql)) &&
        (!src || m.sources.some((s) => s.type === src))
    );
  }, [data, q, src]);

  return (
    <section className="space-y-3">
      <h3 className="section-title">
        🐎 Mounts &amp; Minions
        <InfoTip text="Browse every mount and minion with its picture and exactly how to obtain it (trial, achievement, PvP, FATE, tribe, store, etc.). Search by name or filter by source." />
      </h3>

      <div className="glass space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {(["mounts", "minions"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={clsx(
                "rounded-2xl px-3.5 py-1.5 text-sm font-semibold transition",
                kind === k
                  ? "bg-gradient-to-r from-lavender-500 to-lavender-400 text-white shadow-soft"
                  : "bg-white/60 text-slate-600 ring-1 ring-inset ring-lavender-200/70 hover:bg-white dark:bg-white/5 dark:text-slate-200 dark:ring-white/10"
              )}
            >
              {k === "mounts" ? "🐎 Mounts" : "🐱 Minions"}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="field"
            placeholder={`Search ${kind} by name…`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="field" value={src} onChange={(e) => setSrc(e.target.value)}>
            <option value="">All sources (how to obtain)</option>
            {sourceTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-400">
          {loading ? "Loading…" : `${filtered.length.toLocaleString()} ${kind} · showing first ${Math.min(filtered.length, 120)}`}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass shimmer h-28" />)
          : filtered.slice(0, 120).map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.02 }}
                className="glass flex gap-3 p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.icon ?? ""}
                  alt={m.name}
                  className="h-16 w-16 shrink-0 rounded-xl bg-lavender-100/50 object-contain p-1 dark:bg-white/5"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-display font-bold text-slate-800 dark:text-slate-100">
                      {m.name}
                    </span>
                    {m.tradeable && (
                      <span className="chip bg-emerald-100 text-emerald-700 ring-emerald-200" title="Buyable on the Market Board">
                        💰 MB
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    {m.sources.length ? (
                      m.sources.slice(0, 2).map((s, j) => (
                        <div key={j} className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className={clsx("chip", srcStyle(s.type))}>{s.type}</span>
                          <span className="text-slate-500 dark:text-slate-400">{s.text}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400">Source unknown</span>
                    )}
                  </div>
                  {m.patch && <div className="mt-1 text-[10px] text-slate-400">patch {m.patch}</div>}
                </div>
              </motion.div>
            ))}
        {!loading && filtered.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-slate-400">No {kind} match those filters.</p>
        )}
      </div>
    </section>
  );
}
