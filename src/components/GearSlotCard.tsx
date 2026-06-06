"use client";

import { motion } from "framer-motion";
import type { GearRecommendation } from "@/lib/types";
import { SLOT_EMOJI, SLOT_LABEL } from "@/lib/gear";
import { RecLabelChip } from "./RecLabelChip";
import { PriceDisplay } from "./PriceDisplay";

const UNIVERSALIS = "https://universalis.app/market";

export function GearSlotCard({
  rec,
  index = 0,
}: {
  rec: GearRecommendation;
  index?: number;
}) {
  const equippedName = rec.equipped?.name && rec.equipped.name !== "—" ? rec.equipped.name : null;
  const searchUrl =
    rec.price?.itemId != null
      ? `${UNIVERSALIS}/${rec.price.itemId}`
      : rec.marketSearch
      ? `https://universalis.app/search?q=${encodeURIComponent(
          rec.marketSearch.replace(/\s+HQ$/i, "")
        )}`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
      className="glass glass-hover flex flex-col gap-3 p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-lavender-100 text-lg dark:bg-white/10">
            {SLOT_EMOJI[rec.slot]}
          </span>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-lavender-500/80 dark:text-lavender-300/70">
              {SLOT_LABEL[rec.slot]}
            </div>
            {equippedName ? (
              <div className="text-[11px] text-slate-400">
                now: {equippedName}
                {rec.equipped?.itemLevel ? ` · i${rec.equipped.itemLevel}` : ""}
              </div>
            ) : (
              <div className="text-[11px] italic text-slate-400">empty / unknown</div>
            )}
          </div>
        </div>
        <RecLabelChip label={rec.label} />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-slate-800 dark:text-slate-100">
            {rec.recommendedName}
          </span>
          {rec.expectedItemLevel ? (
            <span className="chip bg-sky-100 text-sky-700 ring-sky-200 dark:bg-white/10 dark:text-sky-200">
              i{rec.expectedItemLevel}
            </span>
          ) : null}
          {rec.hqMatters ? (
            <span className="chip bg-gold-300/40 text-gold-600 ring-gold-300/60">
              HQ matters
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {rec.reason}
        </p>
      </div>

      {rec.label !== "USE_POETICS" && rec.label !== "DUNGEON_DROP" ? (
        <PriceDisplay price={rec.price} hq={rec.hqMatters} />
      ) : null}

      {searchUrl ? (
        <a
          href={searchUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-semibold text-lavender-600 underline-offset-2 hover:underline dark:text-lavender-300"
        >
          Search “{rec.marketSearch || rec.recommendedName}” on Universalis ↗
        </a>
      ) : null}
    </motion.div>
  );
}
