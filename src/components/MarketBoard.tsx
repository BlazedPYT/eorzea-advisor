"use client";

import { useState } from "react";
import { Autocomplete, type SuggestItem } from "./Autocomplete";
import { useMarket } from "./MarketModal";

// In-app Market Board lookup: search any item, see live listings without
// ever leaving the app.
export function MarketBoard() {
  const market = useMarket();
  const [q, setQ] = useState("");

  async function fetchItems(q: string): Promise<SuggestItem[]> {
    const res = await fetch(`/api/items/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    return (data.items ?? []).map((it: { id: number; name: string }) => ({
      value: it.name,
      label: it.name,
      data: it,
    }));
  }

  return (
    <section className="space-y-3">
      <h3 className="section-title">🔍 Market Board lookup</h3>
      <div className="glass p-4">
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
          Search any item to see live prices across your Data Center — listings and
          recent sales open right here, no browser needed.
        </p>
        <Autocomplete
          value={q}
          onChange={setQ}
          onSelect={(item) => {
            const it = item.data as { id: number; name: string };
            market.openItem(it.id, it.name);
            setQ("");
          }}
          fetcher={fetchItems}
          minChars={2}
          placeholder="Search an item… (e.g. Ramie Robe of Healing, Boiled Egg)"
          emptyHint="Type at least 2 letters to search the game's item list."
        />
      </div>
    </section>
  );
}
