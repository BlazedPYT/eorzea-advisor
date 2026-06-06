"use client";

import { motion } from "framer-motion";
import type { AdvisorResult } from "@/lib/types";
import { Mascot } from "./Mascot";

export function WhatNextCard({ whatNext }: { whatNext: AdvisorResult["whatNext"] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass relative overflow-hidden p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-lavender-200/40 via-transparent to-gold-300/20" />
      <div className="relative flex items-start gap-4">
        <Mascot size={84} className="hidden shrink-0 drop-shadow sm:block" />
        <div className="min-w-0">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-lavender-600/80 dark:text-lavender-300/80">
            ✨ What should I do next?
          </div>
          <h3 className="font-display text-2xl font-bold leading-tight text-slate-800 dark:text-slate-50">
            {whatNext.headline}
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-200">
            👉 {whatNext.action}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{whatNext.sub}</p>
        </div>
      </div>
    </motion.div>
  );
}
