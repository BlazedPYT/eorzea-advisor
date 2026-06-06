"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { TaxRates } from "@/lib/types";
import { InfoTip } from "./InfoTip";

const CITY_EMOJI: Record<string, string> = {
  "Limsa Lominsa": "⚓",
  Gridania: "🌳",
  "Ul'dah": "🏜️",
  Ishgard: "❄️",
  Kugane: "🏯",
  Crystarium: "💎",
  "Old Sharlayan": "📚",
  Tuliyollal: "🌅",
};

// Live Market Board retainer/counter tax per city (the real "goblin tax").
// Selling in the lowest-tax city keeps more gil in your pocket.
export function MarketTax({ world }: { world: string }) {
  const [tax, setTax] = useState<TaxRates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/universalis/tax?world=${encodeURIComponent(world || "Gilgamesh")}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setTax(d.error ? null : d))
      .catch(() => !cancelled && setTax(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [world]);

  if (loading) return <div className="glass shimmer h-28" />;
  if (!tax) return null;

  return (
    <section className="space-y-3">
      <h3 className="section-title">
        👺 Live Market Board tax (goblin tax)
        <InfoTip text="When you SELL on the Market Board, the retainer's city takes a cut as tax. These are live rates — list your items via a retainer in the lowest-tax city (highlighted green) to keep more gil." />
      </h3>
      <div className="glass p-4">
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
          Every Market Board sale is taxed by the retainer city. Live rates on{" "}
          <strong>{tax.scope}</strong> — sell in{" "}
          <strong className="text-emerald-600">
            {tax.lowest?.city} ({tax.lowest?.rate}%)
          </strong>{" "}
          to keep the most gil.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tax.rates.map((r, i) => {
            const isLowest = r.city === tax.lowest?.city;
            return (
              <motion.div
                key={r.city}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-2xl px-3 py-2 ring-1 ring-inset ${
                  isLowest
                    ? "bg-emerald-100/70 ring-emerald-300 dark:bg-emerald-500/10"
                    : "bg-white/50 ring-lavender-200/60 dark:bg-white/5 dark:ring-white/10"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span>{CITY_EMOJI[r.city] ?? "🏙️"}</span>
                  <span className="truncate">{r.city}</span>
                </div>
                <div
                  className={`font-display text-lg font-bold ${
                    isLowest ? "text-emerald-600" : "text-slate-800 dark:text-slate-100"
                  }`}
                >
                  {r.rate}%
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
