"use client";

import { useEffect, useState } from "react";
import type { CharacterProfile, GearItem, GearRecommendation } from "@/lib/types";
import { GearSlotCard } from "./GearSlotCard";
import { InfoTip } from "./InfoTip";

function SkeletonCard() {
  return (
    <div className="glass shimmer h-44 p-4">
      <div className="h-9 w-9 rounded-xl bg-lavender-200/50" />
      <div className="mt-3 h-3 w-2/3 rounded bg-lavender-200/40" />
      <div className="mt-2 h-3 w-1/2 rounded bg-lavender-200/30" />
      <div className="mt-4 h-10 w-full rounded-2xl bg-lavender-200/30" />
    </div>
  );
}

export function GearAdvisor({
  profile,
  equipped,
}: {
  profile: CharacterProfile;
  equipped: GearItem[];
}) {
  const [recs, setRecs] = useState<GearRecommendation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNote(null);
    fetch("/api/advisor/gear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, equipped }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setRecs(data.recommendations ?? []);
        setNote(data.note ?? data.error ?? null);
      })
      .catch(() => !cancelled && setRecs([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // re-run when the meaningful inputs change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.job, profile.level, profile.world, profile.gil, equipped.length]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="section-title">
          🛡️ Gear recommendations
          <InfoTip text="A recommended item for each of your 11 gear slots, with a live Market Board price and a Buy / Skip / Replace-soon label. 'Better from Poetics/dungeon' means don't spend gil — get it free in-game. Tap 'View live listings' to see prices without leaving the app." />
        </h3>
        <span className="text-xs text-slate-400">
          live Market Board pricing · {profile.world || "Aether"}
        </span>
      </div>
      {note && (
        <div className="rounded-2xl bg-amber-100/70 px-3 py-2 text-xs text-amber-700 dark:bg-white/5 dark:text-amber-300">
          {note}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : recs?.map((rec, i) => (
              <GearSlotCard key={`${rec.slot}-${i}`} rec={rec} index={i} />
            ))}

        {/* Future feature placeholder (disabled) */}
        {!loading && (
          <div className="glass relative flex flex-col justify-center gap-2 overflow-hidden border-dashed p-4 opacity-80">
            <span className="chip w-fit bg-slate-100 text-slate-500 ring-slate-200 dark:bg-white/10 dark:text-slate-300">
              🔒 Coming soon
            </span>
            <div className="font-display font-bold text-slate-700 dark:text-slate-100">
              📸 Screenshot Gear Import
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload a screenshot of your Character window and we’ll try to read your
              gear — a safer alternative to a live plugin. (Not enabled yet.)
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
