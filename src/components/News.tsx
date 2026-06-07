"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { InfoTip } from "./InfoTip";

type NewsCategory = "Topics" | "Notices" | "Maintenance" | "Updates" | "Status";
interface NewsItem { title: string; url: string; ms: number; category: NewsCategory }

const CAT_STYLE: Record<NewsCategory, string> = {
  Topics: "bg-lavender-100 text-lavender-700 ring-lavender-200",
  Notices: "bg-sky-100 text-sky-700 ring-sky-200",
  Maintenance: "bg-amber-100 text-amber-700 ring-amber-200",
  Updates: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  Status: "bg-rose-100 text-rose-700 ring-rose-200",
};
const CAT_EMOJI: Record<NewsCategory, string> = {
  Topics: "📰",
  Notices: "📌",
  Maintenance: "🛠️",
  Updates: "⬆️",
  Status: "⚠️",
};

function ago(ms: number) {
  const d = Math.round((Date.now() - ms) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  return new Date(ms).toLocaleDateString();
}

const FILTERS = ["All", "Topics", "Notices", "Maintenance", "Updates", "Status"] as const;

export function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((d) => setNews(d.news ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maintenance = useMemo(
    () => news.find((n) => n.category === "Maintenance" || n.category === "Status"),
    [news]
  );
  const shown = filter === "All" ? news : news.filter((n) => n.category === filter);

  return (
    <section className="space-y-3">
      <h3 className="section-title">
        📰 FFXIV News
        <InfoTip text="Live headlines from the official Lodestone — topics, notices, maintenance, updates and server status. Tap one to read the full article." />
      </h3>

      {/* maintenance highlight */}
      {maintenance && (
        <a
          href={maintenance.url}
          target="_blank"
          rel="noreferrer"
          className="glass glass-hover block border-l-4 border-l-amber-400 p-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{CAT_EMOJI[maintenance.category]}</span>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-amber-600">
                Latest {maintenance.category.toLowerCase()}
              </div>
              <div className="font-display font-bold text-slate-800 dark:text-slate-100">
                {maintenance.title}
              </div>
              <div className="text-[11px] text-slate-400">{ago(maintenance.ms)} · tap to read ↗</div>
            </div>
          </div>
        </a>
      )}

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "rounded-2xl px-3 py-1.5 text-xs font-semibold transition",
              filter === f
                ? "bg-gradient-to-r from-lavender-500 to-lavender-400 text-white shadow-soft"
                : "bg-white/60 text-slate-600 ring-1 ring-inset ring-lavender-200/70 hover:bg-white dark:bg-white/5 dark:text-slate-200 dark:ring-white/10"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="glass p-2">
        {loading ? (
          <div className="space-y-1.5 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shimmer h-12 rounded-xl bg-lavender-200/30" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className="p-4 text-center text-sm text-slate-400">
            Couldn’t load news right now (you may be offline).
          </p>
        ) : (
          <ul className="space-y-1">
            {shown.map((n, i) => (
              <li key={i}>
                <motion.a
                  href={n.url}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i, 10) * 0.02 }}
                  className="flex items-center gap-3 rounded-xl bg-white/50 px-3 py-2 transition hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <span className="text-lg">{CAT_EMOJI[n.category]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {n.title}
                    </span>
                    <span className="text-[11px] text-slate-400">{ago(n.ms)}</span>
                  </span>
                  <span className={clsx("chip shrink-0", CAT_STYLE[n.category])}>{n.category}</span>
                </motion.a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
