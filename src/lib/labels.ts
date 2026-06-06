import type { RecLabel } from "./types";

// ---------------------------------------------------------------------------
// Cute, on-brand text + styling for every recommendation label.
// ---------------------------------------------------------------------------

export interface LabelStyle {
  text: string; // cute display text
  emoji: string;
  className: string; // tailwind chip styling
}

export const LABELS: Record<RecLabel, LabelStyle> = {
  BUY: {
    text: "Buy this, bestie",
    emoji: "💖",
    className: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  },
  WORTH_IT: {
    text: "Worth the gil",
    emoji: "✅",
    className: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  },
  SKIP: {
    text: "Skip for now",
    emoji: "🙅",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  LATER: {
    text: "Maybe later",
    emoji: "🕓",
    className: "bg-amber-100 text-amber-700 ring-amber-200",
  },
  REPLACE_SOON: {
    text: "Replace soon",
    emoji: "♻️",
    className: "bg-orange-100 text-orange-700 ring-orange-200",
  },
  GOBLIN_TAX: {
    text: "Goblin tax warning",
    emoji: "👺",
    className: "bg-rose-100 text-rose-700 ring-rose-200",
  },
  LUXURY: {
    text: "Luxury flex",
    emoji: "💎",
    className: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200",
  },
  TOO_EXPENSIVE: {
    text: "Too expensive",
    emoji: "🥵",
    className: "bg-red-100 text-red-700 ring-red-200",
  },
  USE_POETICS: {
    text: "Better from Poetics",
    emoji: "🪙",
    className: "bg-sky-100 text-sky-700 ring-sky-200",
  },
  DUNGEON_DROP: {
    text: "Better from dungeon drops",
    emoji: "🗝️",
    className: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  },
};

export function labelStyle(label: RecLabel): LabelStyle {
  return LABELS[label];
}
