"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { InfoTip } from "./InfoTip";
import { useSettings } from "./SettingsProvider";
import { useMarket } from "./MarketModal";

interface Source { type: string; text: string; level?: number | null; ilvl?: number | null }
interface Coll {
  id: number;
  name: string;
  icon: string | null;
  image: string | null;
  itemId: number | null;
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
  const { settings, fmt } = useSettings();
  const market = useMarket();
  const [kind, setKind] = useState<"mounts" | "minions">("mounts");
  const [cache, setCache] = useState<Record<string, Coll[]>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [src, setSrc] = useState("");
  const [sort, setSort] = useState("default");
  const [prices, setPrices] = useState<Record<number, { cheapest?: number; world?: string }>>({});
  const [limit, setLimit] = useState(60);
  const [open, setOpen] = useState<Coll | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [price, setPrice] = useState<{ cheapest?: number; world?: string } | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  function openDetail(m: Coll) {
    setOpen(m);
    setVideoId(null);
    setLoadingVideo(true);
    setPrice(null);
    const label = kind === "mounts" ? "mount" : "minion";
    fetch(`/api/youtube?q=${encodeURIComponent(`${m.name} FFXIV ${label}`)}`)
      .then((r) => r.json())
      .then((d) => setVideoId(d.videoId ?? null))
      .catch(() => setVideoId(null))
      .finally(() => setLoadingVideo(false));

    // live Market Board price for tradeable collectibles
    if (m.tradeable && m.itemId) {
      setLoadingPrice(true);
      fetch(`/api/universalis/item?id=${m.itemId}&world=${encodeURIComponent(settings.homeWorld || "Aether")}`)
        .then((r) => r.json())
        .then((d) => {
          const l = d.listings?.[0];
          setPrice({ cheapest: l?.price ?? d.minNq ?? d.minHq, world: l?.world });
        })
        .catch(() => setPrice(null))
        .finally(() => setLoadingPrice(false));
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  // Batch-fetch cheapest prices for tradeable items so cards show price inline.
  const pricedKey = useRef("");
  useEffect(() => {
    const key = `${kind}:${settings.homeWorld}`;
    if (!data.length || pricedKey.current === key) return;
    pricedKey.current = key;
    setPrices({});
    const ids = data.filter((m) => m.tradeable && m.itemId).map((m) => m.itemId as number);
    const world = settings.homeWorld || "Aether";
    (async () => {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        try {
          const r = await fetch(`/api/universalis/prices?world=${encodeURIComponent(world)}&ids=${chunk.join(",")}`);
          const d = await r.json();
          setPrices((p) => ({ ...p, ...d.prices }));
        } catch {
          /* ignore */
        }
      }
    })();
  }, [data, kind, settings.homeWorld]);

  // Reset how many are shown whenever the list/filters change.
  useEffect(() => setLimit(60), [kind, q, src, sort]);

  const sourceTypes = useMemo(() => {
    const s = new Set<string>();
    for (const m of data) for (const so of m.sources) s.add(so.type);
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const out = data.filter(
      (m) =>
        (!ql || m.name.toLowerCase().includes(ql)) &&
        (!src || m.sources.some((s) => s.type === src))
    );
    const cheap = (m: Coll) => (m.itemId && prices[m.itemId]?.cheapest) || 0;
    if (sort === "name-asc") out.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "name-desc") out.sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === "price-asc")
      out.sort((a, b) => (cheap(a) || Infinity) - (cheap(b) || Infinity));
    else if (sort === "price-desc") out.sort((a, b) => cheap(b) - cheap(a));
    return out;
  }, [data, q, src, sort, prices]);

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
        <div className="grid gap-2 sm:grid-cols-3">
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
          <select className="field" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="default">Sort: default</option>
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
          </select>
        </div>
        <div className="text-xs text-slate-400">
          {loading ? "Loading…" : `${filtered.length.toLocaleString()} ${kind} · showing ${Math.min(filtered.length, limit)}`}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass shimmer h-28" />)
          : filtered.slice(0, limit).map((m, i) => (
              <motion.button
                key={m.id}
                type="button"
                onClick={() => openDetail(m)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.02 }}
                className="glass glass-hover flex gap-3 p-3 text-left"
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
                  {m.tradeable && m.itemId && (
                    <div className="mt-1 text-[11px] font-semibold text-gold-600">
                      💰{" "}
                      {prices[m.itemId]?.cheapest
                        ? `${fmt(prices[m.itemId].cheapest)} gil`
                        : prices[m.itemId]
                        ? "not listed"
                        : "…"}
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
        {!loading && filtered.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-slate-400">No {kind} match those filters.</p>
        )}
      </div>

      {/* load more / show all */}
      {!loading && filtered.length > limit && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setLimit((l) => l + 60)} className="btn-primary">
            Load more ({filtered.length - limit} more)
          </button>
          <button onClick={() => setLimit(filtered.length)} className="btn-ghost">
            Show all {filtered.length}
          </button>
        </div>
      )}

      {/* detail: big image + in-app video */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setOpen(null)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass flex max-h-[90vh] w-full max-w-2xl flex-col overflow-auto rounded-t-3xl sm:rounded-3xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/40 p-5 dark:border-white/10">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-lavender-500/80">
                    {kind === "mounts" ? "🐎 Mount" : "🐱 Minion"}
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-100">{open.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {open.sources.map((s, j) => (
                      <span key={j} className="flex items-center gap-1 text-[11px]">
                        <span className={clsx("chip", srcStyle(s.type))}>{s.type}</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {s.text}
                          {s.level ? ` · ⚑ Lv ${s.level} to enter${s.ilvl ? ` (iLvl ${s.ilvl})` : ""}` : ""}
                        </span>
                      </span>
                    ))}
                    {open.tradeable && <span className="chip bg-emerald-100 text-emerald-700 ring-emerald-200">💰 Market Board</span>}
                  </div>
                </div>
                <button onClick={() => setOpen(null)} className="btn-ghost shrink-0 !rounded-full !px-3 !py-1.5">✕</button>
              </div>

              <div className="space-y-4 p-5">
                {/* big image */}
                {open.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={open.image}
                    alt={open.name}
                    className="mx-auto max-h-72 w-auto rounded-2xl bg-lavender-100/40 object-contain p-2 dark:bg-white/5"
                  />
                )}
                {open.description && (
                  <p className="text-sm italic text-slate-600 dark:text-slate-300">“{open.description}”</p>
                )}

                {/* live Market Board price (tradeable) */}
                {open.tradeable && open.itemId && (
                  <div className="rounded-2xl bg-gradient-to-br from-cream-100/80 to-lavender-100/60 p-3 dark:from-white/[0.04] dark:to-white/[0.02]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                        💰 Market Board{" "}
                        {loadingPrice ? (
                          <span className="text-slate-400">checking price…</span>
                        ) : price?.cheapest ? (
                          <>
                            <span className="font-display text-gold-600">{fmt(price.cheapest)} gil</span>
                            {price.world ? <span className="text-slate-400"> · {price.world} 🌐</span> : null}
                          </>
                        ) : (
                          <span className="text-slate-400">no current listings on {settings.homeWorld || "your DC"}</span>
                        )}
                      </div>
                      <button
                        onClick={() => market.openItem(open.itemId as number, open.name, open.icon ?? undefined)}
                        className="shrink-0 rounded-lg bg-lavender-100 px-2.5 py-1 text-[11px] font-semibold text-lavender-700 ring-1 ring-inset ring-lavender-200 hover:bg-lavender-200 dark:bg-white/10 dark:text-lavender-200 dark:ring-white/10"
                      >
                        🔎 View listings / buy
                      </button>
                    </div>
                  </div>
                )}

                {/* in-app video */}
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
                    ▶️ Showcase video
                    <InfoTip text="Top YouTube result for this collectible, playing right here in the app." />
                  </div>
                  {loadingVideo ? (
                    <div className="shimmer aspect-video w-full rounded-2xl bg-lavender-200/30" />
                  ) : videoId ? (
                    <div className="aspect-video w-full overflow-hidden rounded-2xl">
                      <iframe
                        className="h-full w-full"
                        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                        title={`${open.name} showcase`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <p className="rounded-2xl bg-slate-100/70 px-3 py-4 text-center text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">
                      No video found (you may be offline).
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
