"use client";

import { useEffect, useMemo, useState } from "react";
import { Responsive, WidthProvider, type Layout, type Layouts } from "react-grid-layout";
import clsx from "clsx";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { InfoTip } from "./InfoTip";

// ---------------------------------------------------------------------------
// "My Board" — a free-form, draggable + resizable dashboard. The user picks
// which sections to show as panels and arranges them however they like; the
// layout (and which panels are enabled) is saved per device. Panels reuse the
// exact same section nodes as the tabbed view, so there's no duplicated UI.
//
// Drag is restricted to each panel's header (.board-drag-handle) so inputs,
// buttons and links inside a panel keep working normally.
// ---------------------------------------------------------------------------

export interface BoardSection {
  id: string;
  label: string;
  emoji: string;
  node: React.ReactNode;
}

const ResponsiveGridLayout = WidthProvider(Responsive);

const STORAGE_KEY = "ea-board-v1";
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
const ROW_HEIGHT = 40;

interface Stored {
  enabled: string[];
  layouts: Layouts;
}

// A sensible default starting board: a couple of common panels, side by side.
function defaultEnabled(available: string[]): string[] {
  const wanted = ["dailies", "leveling", "gear", "market"];
  const picked = wanted.filter((id) => available.includes(id));
  return picked.length ? picked : available.slice(0, 3);
}

// Default grid box for a panel that doesn't have a saved position yet.
function defaultBox(index: number, cols: number, w: number) {
  const perRow = Math.max(1, Math.floor(cols / w));
  return {
    x: (index % perRow) * w,
    y: Math.floor(index / perRow) * 9,
    w,
    h: 9,
    minW: 2,
    minH: 4,
  };
}

export function BoardLayout({ sections }: { sections: BoardSection[] }) {
  const available = useMemo(() => sections.map((s) => s.id), [sections]);
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState<string[]>([]);
  const [layouts, setLayouts] = useState<Layouts>({});

  // Load saved board (or seed a default) once, on the client.
  useEffect(() => {
    setMounted(true);
    let loaded: Stored | null = null;
    try {
      loaded = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      loaded = null;
    }
    if (loaded?.enabled?.length) {
      setEnabled(loaded.enabled.filter((id) => available.includes(id)));
      setLayouts(loaded.layouts ?? {});
    } else {
      setEnabled(defaultEnabled(available));
      setLayouts({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(nextEnabled: string[], nextLayouts: Layouts) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ enabled: nextEnabled, layouts: nextLayouts })
      );
    } catch {
      /* ignore */
    }
  }

  function toggle(id: string) {
    setEnabled((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      persist(next, layouts);
      return next;
    });
  }

  function resetBoard() {
    const next = defaultEnabled(available);
    setEnabled(next);
    setLayouts({});
    persist(next, {});
  }

  function onLayoutChange(_current: Layout[], all: Layouts) {
    setLayouts(all);
    persist(enabled, all);
  }

  const enabledSections = enabled
    .map((id) => sections.find((s) => s.id === id))
    .filter((s): s is BoardSection => !!s);

  return (
    <div className="space-y-4">
      {/* panel picker */}
      <div className="glass p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-lavender-500/70 dark:text-lavender-300/60">
            Your board — add, drag &amp; resize panels
            <InfoTip text="Tap a chip to add/remove that panel. Drag a panel by its title bar to move it, and drag the bottom-right corner to resize. Your layout is saved on this device." />
          </div>
          <button onClick={resetBoard} className="btn-ghost !py-1 text-xs">
            ↺ Reset layout
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sections.map((s) => {
            const on = enabled.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={clsx(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition",
                  on
                    ? "bg-gradient-to-r from-lavender-500 to-lavender-400 text-white shadow-soft"
                    : "bg-lavender-100/70 text-lavender-700 ring-1 ring-inset ring-lavender-200 hover:bg-lavender-200 dark:bg-white/5 dark:text-lavender-200 dark:ring-white/10"
                )}
              >
                <span>{s.emoji}</span>
                {s.label}
                <span className="opacity-70">{on ? "✓" : "+"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {enabledSections.length === 0 ? (
        <div className="glass grid place-items-center py-16 text-center text-sm text-slate-500 dark:text-slate-400">
          No panels yet — tap a chip above to add one to your board.
        </div>
      ) : (
        mounted && (
          <ResponsiveGridLayout
            className="layout -mx-1"
            layouts={layouts}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={ROW_HEIGHT}
            margin={[12, 12]}
            draggableHandle=".board-drag-handle"
            onLayoutChange={onLayoutChange}
            // Free-form board: no vertical compaction, so a panel stays exactly
            // where you drop it instead of snapping back up to close gaps.
            compactType={null}
            preventCollision={false}
            isBounded
          >
            {enabledSections.map((s, i) => (
              <div
                key={s.id}
                data-grid={defaultBox(i, COLS.lg, 6)}
                className="glass flex !overflow-hidden flex-col p-0"
              >
                <div className="board-drag-handle flex shrink-0 cursor-move items-center justify-between gap-2 border-b border-lavender-200/50 bg-white/40 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
                  <span className="flex items-center gap-1.5 font-display text-sm font-bold text-slate-700 dark:text-slate-100">
                    <span>{s.emoji}</span>
                    {s.label}
                  </span>
                  <button
                    onClick={() => toggle(s.id)}
                    className="rounded-lg px-1.5 text-sm text-slate-400 hover:bg-white/60 hover:text-slate-600 dark:hover:bg-white/10"
                    title="Remove from board"
                  >
                    ✕
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-3">{s.node}</div>
              </div>
            ))}
          </ResponsiveGridLayout>
        )
      )}
    </div>
  );
}
