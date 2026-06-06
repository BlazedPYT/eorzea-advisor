"use client";

import { bracketForLevel } from "@/lib/brackets";

export function LevelSelector({
  value,
  onChange,
  max = 100,
}: {
  value: number;
  onChange: (level: number) => void;
  max?: number;
}) {
  const bracket = bracketForLevel(value);
  const pct = (value / max) * 100;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">
          Lv {value}
        </span>
        <span className="chip bg-lavender-100 text-lavender-700 ring-lavender-200 dark:bg-white/10 dark:text-lavender-200">
          {bracket.label}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-lavender-200/60 accent-lavender-500 dark:bg-white/10"
        style={{
          background: `linear-gradient(to right, #8b66e0 ${pct}%, rgba(167,139,234,0.25) ${pct}%)`,
        }}
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[1, 50, 60, 70, 80, 90, 100].map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            className="rounded-lg bg-white/60 px-2 py-0.5 text-[11px] font-semibold text-lavender-700 ring-1 ring-inset ring-lavender-200 hover:bg-white dark:bg-white/5 dark:text-lavender-200 dark:ring-white/10"
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
