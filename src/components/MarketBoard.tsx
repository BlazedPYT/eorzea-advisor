"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { categoryGroupLabel, type ItemCategory } from "@/lib/xivapi";
import { useMarket } from "./MarketModal";
import { InfoTip } from "./InfoTip";

// In-app Market Board lookup. Mirrors the in-game search: pick a category
// and/or type a name, then click any result to see live prices in a panel —
// never leaving the app. Results render inline (no floating menus to overlap).
export function MarketBoard() {
  const market = useMarket();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(0);
  const [cats, setCats] = useState<ItemCategory[]>([]);
  const [items, setItems] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  // Load the in-game category list once.
  useEffect(() => {
    fetch("/api/items/categories")
      .then((r) => r.json())
      .then((d) => setCats(d.categories ?? []))
      .catch(() => {});
  }, []);

  // Debounced search whenever the query or category changes.
  useEffect(() => {
    if (q.trim().length < 2 && !category) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (q.trim().length >= 2) params.set("q", q.trim());
        if (category) params.set("category", String(category));
        const res = await fetch(`/api/items/search?${params.toString()}`);
        const data = await res.json();
        if (id === reqId.current) setItems(data.items ?? []);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q, category]);

  // Build grouped <optgroup>s for the category select.
  const grouped = useMemo(() => {
    const groups: Record<number, ItemCategory[]> = {};
    for (const c of cats) (groups[c.group] ??= []).push(c);
    return Object.entries(groups).map(([g, list]) => ({
      group: Number(g),
      label: categoryGroupLabel(Number(g)),
      list,
    }));
  }, [cats]);

  return (
    <section className="space-y-3">
      <h3 className="section-title">
        🔍 Market Board lookup
        <InfoTip text="Search any item for live prices across your Data Center — exactly like the in-game Market Board, with the same categories. Click a result to see every listing (price, quantity, HQ, world, retainer city) and recent sales, all in-app." />
      </h3>

      <div className="glass p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={category}
            onChange={(e) => setCategory(Number(e.target.value))}
            className="field sm:max-w-[14rem]"
          >
            <option value={0}>All categories</option>
            {grouped.map((g) => (
              <optgroup key={g.group} label={g.label}>
                {g.list.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <input
            className="field flex-1"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search an item… (e.g. Ramie Robe of Healing, Boiled Egg)"
            spellCheck={false}
          />
        </div>

        {/* results */}
        <div className="mt-3">
          {loading && (
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shimmer h-10 rounded-xl bg-lavender-200/30" />
              ))}
            </div>
          )}

          {!loading && (q.trim().length >= 2 || category > 0) && items.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">
              No marketable items found — try a different name or category.
            </p>
          )}

          {!loading && items.length > 0 && (
            <ul className="max-h-80 space-y-1 overflow-auto pr-1">
              {items.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => market.openItem(it.id, it.name)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl bg-white/50 px-3 py-2.5 text-left transition hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-100">
                      {it.name}
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold text-lavender-500">
                      see prices →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && q.trim().length < 2 && category === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">
              Pick a category or type at least 2 letters to search the live Market Board.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
