"use client";

import type { PriceInfo } from "@/lib/types";
import { useSettings } from "./SettingsProvider";

function ago(ms?: number) {
  if (!ms) return null;
  const diff = Date.now() - ms;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function PriceDisplay({ price, hq }: { price?: PriceInfo; hq?: boolean }) {
  const { settings, fmt, fmtTime } = useSettings();
  if (!price) {
    return (
      <div className="rounded-2xl bg-lavender-100/60 px-3 py-2 text-xs text-lavender-700 dark:bg-white/5 dark:text-lavender-200">
        No price — search the Market Board manually.
      </div>
    );
  }
  if (price.error) {
    return (
      <div className="rounded-2xl bg-slate-100/70 px-3 py-2 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-300">
        {price.error}
      </div>
    );
  }

  const cheapest = hq ? price.cheapestHq ?? price.cheapest : price.cheapest;
  const updated = ago(price.lastUploadMs);
  const sold = ago(price.lastSaleMs);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-cream-100/80 to-lavender-100/60 px-3 py-2 dark:from-white/[0.04] dark:to-white/[0.02]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-lavender-600/70 dark:text-lavender-300/70">
          {hq ? "Cheapest HQ" : "Cheapest"}
          {price.worldName ? (
            <span className="ml-1 normal-case text-lavender-500/80">
              · {price.worldName} 🌐
            </span>
          ) : null}
        </span>
        <span className="font-display text-base font-bold text-slate-800 dark:text-slate-100">
          {fmt(cheapest)}
          <span className="ml-0.5 text-xs font-semibold text-gold-600"> gil</span>
          {settings.includeTax ? (
            <span className="ml-1 text-[10px] font-semibold text-lavender-500">incl. tax</span>
          ) : null}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
        {price.averageHq ? <span>avg HQ {fmt(price.averageHq)}</span> : null}
        {price.averageNq ? <span>avg NQ {fmt(price.averageNq)}</span> : null}
        {price.salesPerDay != null ? (
          <span title="Live sale velocity">
            {price.salesPerDay >= 1
              ? `🔥 ${price.salesPerDay}/day`
              : `🐌 ${price.salesPerDay}/day`}
          </span>
        ) : null}
        {price.lastSalePrice ? (
          <span>
            last sold {fmt(price.lastSalePrice)}
            {sold ? ` (${sold})` : ""}
          </span>
        ) : null}
        {updated ? (
          <span title={fmtTime(price.lastUploadMs)}>updated {updated}</span>
        ) : null}
        {price.scope ? <span>· {price.scope}</span> : null}
      </div>
    </div>
  );
}
