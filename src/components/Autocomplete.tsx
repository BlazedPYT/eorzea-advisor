"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

export interface SuggestItem {
  value: string; // what goes into the input
  label: string; // primary display
  sublabel?: string; // secondary (e.g. world / DC)
  avatar?: string; // optional image url
  data?: unknown; // passthrough for onSelect
}

export function Autocomplete({
  value,
  onChange,
  onSelect,
  fetcher,
  placeholder,
  minChars = 1,
  debounceMs = 250,
  emptyHint,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (item: SuggestItem) => void;
  fetcher: (query: string) => Promise<SuggestItem[]>;
  placeholder?: string;
  minChars?: number;
  debounceMs?: number;
  emptyHint?: string;
}) {
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  // Debounced fetch whenever the value changes.
  useEffect(() => {
    if (value.trim().length < minChars) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetcher(value.trim());
        if (id === reqId.current) {
          setItems(res);
          setActive(-1);
        }
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, minChars, debounceMs]);

  // Close on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function choose(item: SuggestItem) {
    onChange(item.value);
    onSelect?.(item);
    setOpen(false);
    setItems([]);
  }

  function onKey(e: React.KeyboardEvent) {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && (loading || items.length > 0 || (emptyHint && value.trim().length >= minChars));

  return (
    <div ref={boxRef} className="relative">
      <input
        className="field"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        autoComplete="off"
        spellCheck={false}
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-lavender-400">
          <span className="inline-block animate-spin">⏳</span>
        </span>
      )}

      <AnimatePresence>
        {showDropdown && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="glass absolute z-30 mt-1.5 max-h-72 w-full overflow-auto p-1.5"
          >
            {items.map((item, i) => (
              <li key={`${item.value}-${i}`}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(item)}
                  className={clsx(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                    active === i
                      ? "bg-lavender-200/70 dark:bg-white/10"
                      : "hover:bg-lavender-100/70 dark:hover:bg-white/5"
                  )}
                >
                  {item.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.avatar}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/60"
                    />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.label}
                    </span>
                    {item.sublabel ? (
                      <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {item.sublabel}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
            {!loading && items.length === 0 && emptyHint ? (
              <li className="px-3 py-2 text-xs text-slate-400">{emptyHint}</li>
            ) : null}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
