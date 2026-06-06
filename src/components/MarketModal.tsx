"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ItemDetail } from "@/lib/universalis";
import { useSettings } from "./SettingsProvider";

interface MarketCtx {
  openItem: (id: number, name?: string) => void;
  openByName: (name: string) => void;
}

const Ctx = createContext<MarketCtx | null>(null);

export function useMarket(): MarketCtx {
  return (
    useContext(Ctx) ?? {
      openItem: () => {},
      openByName: () => {},
    }
  );
}

function gil(n?: number) {
  return n && n > 0 ? n.toLocaleString() : "—";
}
function ago(ms?: number) {
  if (!ms) return "";
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const { settings, fmt, fmtTime } = useSettings();
  const world = settings.homeWorld || "Aether";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string>("");
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (id: number, label?: string) => {
      setOpen(true);
      setLoading(true);
      setDetail(null);
      if (label) setName(label);
      try {
        const res = await fetch(
          `/api/universalis/item?id=${id}&world=${encodeURIComponent(world || "Aether")}`
        );
        setDetail(await res.json());
      } catch {
        setDetail({ itemId: id, scope: world, listings: [], history: [], error: "Failed to load" });
      } finally {
        setLoading(false);
      }
    },
    [world]
  );

  const openItem = useCallback((id: number, label?: string) => load(id, label), [load]);

  const openByName = useCallback(
    async (q: string) => {
      setOpen(true);
      setLoading(true);
      setDetail(null);
      setName(q.replace(/\s+HQ$/i, ""));
      try {
        const res = await fetch(
          `/api/items/search?q=${encodeURIComponent(q.replace(/\s+HQ$/i, ""))}&lang=${settings.language}`
        );
        const data = await res.json();
        const first = data.items?.[0];
        if (first) await load(first.id, first.name);
        else {
          setLoading(false);
          setDetail({ itemId: 0, scope: world, listings: [], history: [], error: "Item not found" });
        }
      } catch {
        setLoading(false);
        setDetail({ itemId: 0, scope: world, listings: [], history: [], error: "Search failed" });
      }
    },
    [load, world]
  );

  // Esc closes the modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Ctx.Provider value={{ openItem, openByName }}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
            >
              {/* header */}
              <div className="flex items-start justify-between gap-3 border-b border-white/40 p-5 dark:border-white/10">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-lavender-500/80">
                    🪙 Live Market Board
                  </div>
                  <h3 className="truncate font-display text-xl font-bold text-slate-800 dark:text-slate-100">
                    {name || "Loading…"}
                  </h3>
                  {detail && !detail.error && (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>across {detail.scope}</span>
                      {detail.minHq ? <span>cheapest HQ {fmt(detail.minHq)}</span> : null}
                      {detail.minNq ? <span>cheapest NQ {fmt(detail.minNq)}</span> : null}
                      {detail.velocity != null ? <span>{detail.velocity}/day sold</span> : null}
                      {detail.lastUploadMs ? <span>updated {ago(detail.lastUploadMs)}</span> : null}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="btn-ghost shrink-0 !rounded-full !px-3 !py-1.5"
                >
                  ✕
                </button>
              </div>

              {/* body */}
              <div className="overflow-auto p-5">
                {loading && (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="shimmer h-9 rounded-xl bg-lavender-200/30" />
                    ))}
                  </div>
                )}

                {!loading && detail?.error && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    {detail.error === "Item not found"
                      ? "Couldn’t find that item on the Market Board."
                      : "No market data right now — nobody’s uploaded prices for this item yet."}
                  </p>
                )}

                {!loading && detail && !detail.error && (
                  <>
                    {/* listings */}
                    <h4 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      Cheapest listings 🌐
                    </h4>
                    {detail.listings.length === 0 ? (
                      <p className="text-sm text-slate-500">No active listings on your Data Center.</p>
                    ) : (
                      <div className="overflow-hidden rounded-2xl ring-1 ring-inset ring-lavender-200/60 dark:ring-white/10">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-lavender-100/60 text-[11px] uppercase tracking-wide text-lavender-600/80 dark:bg-white/5 dark:text-lavender-300/70">
                            <tr>
                              <th className="px-3 py-2">Price</th>
                              <th className="px-3 py-2">Qty</th>
                              <th className="px-3 py-2">Q</th>
                              <th className="px-3 py-2">World</th>
                              <th className="hidden px-3 py-2 sm:table-cell">City</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.listings.slice(0, 15).map((l, i) => (
                              <tr
                                key={i}
                                className="border-t border-lavender-100/70 odd:bg-white/30 dark:border-white/5 dark:odd:bg-white/[0.02]"
                              >
                                <td className="px-3 py-2 font-display font-bold text-slate-800 dark:text-slate-100">
                                  {fmt(l.price)}
                                </td>
                                <td className="px-3 py-2 text-slate-500">{l.qty}</td>
                                <td className="px-3 py-2">
                                  {l.hq ? <span title="High Quality">✨</span> : ""}
                                </td>
                                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                  {l.world ?? "—"}
                                </td>
                                <td className="hidden px-3 py-2 text-slate-500 sm:table-cell">
                                  {l.city ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* history */}
                    {detail.history.length > 0 && (
                      <>
                        <h4 className="mb-2 mt-5 text-sm font-bold text-slate-700 dark:text-slate-200">
                          Recent sales 📈
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.history.slice(0, 12).map((h, i) => (
                            <span
                              key={i}
                              className="chip bg-white/60 text-slate-600 ring-lavender-200/70 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10"
                              title={`${h.world ?? ""} ${ago(h.ms)}`}
                            >
                              {h.hq ? "✨" : ""}
                              {fmt(h.price)} ×{h.qty}
                            </span>
                          ))}
                        </div>
                      </>
                    )}

                    <p className="mt-5 text-center text-[11px] text-slate-400">
                      Live data from Universalis · shown right here, no browser needed 💜
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
