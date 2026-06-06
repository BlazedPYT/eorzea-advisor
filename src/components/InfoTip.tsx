"use client";

import clsx from "clsx";

// A small "?" / "i" helper. Hover, focus, or tap to read how something works.
// CSS-driven (group-hover / focus-within) so it never needs outside-click logic.
export function InfoTip({
  text,
  variant = "q",
  className,
  align = "left",
}: {
  text: string;
  variant?: "q" | "i";
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <span className={clsx("group relative inline-flex align-middle", className)}>
      <button
        type="button"
        tabIndex={0}
        aria-label="More info"
        className={clsx(
          "grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold leading-none ring-1 ring-inset transition-colors",
          variant === "i"
            ? "bg-sky-100 text-sky-600 ring-sky-200 hover:bg-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/20"
            : "bg-lavender-100 text-lavender-600 ring-lavender-200 hover:bg-lavender-200 dark:bg-white/10 dark:text-lavender-200 dark:ring-white/10"
        )}
        onClick={(e) => e.preventDefault()}
      >
        {variant === "i" ? "i" : "?"}
      </button>
      <span
        role="tooltip"
        className={clsx(
          "pointer-events-none absolute bottom-full z-50 mb-2 w-60 rounded-2xl border border-white/60 bg-white/95 p-3 text-left text-[11px] font-medium leading-relaxed text-slate-600 opacity-0 shadow-soft backdrop-blur transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 dark:border-white/10 dark:bg-[#221d34]/95 dark:text-slate-200",
          align === "left" && "left-0",
          align === "right" && "right-0",
          align === "center" && "left-1/2 -translate-x-1/2"
        )}
      >
        {text}
      </span>
    </span>
  );
}
