"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { CRAFT_ACTIONS, resolveAction, type ActionCat } from "@/lib/craftActions";
import { InfoTip } from "./InfoTip";

const CATS: { cat: ActionCat; label: string; tint: string }[] = [
  { cat: "Synthesis", label: "Progress (Synthesis)", tint: "text-rose-600" },
  { cat: "Quality", label: "Quality (Touches)", tint: "text-emerald-600" },
  { cat: "Buff", label: "Buffs", tint: "text-sky-600" },
  { cat: "Utility", label: "Durability / CP", tint: "text-amber-600" },
];

const PRESETS: { name: string; note: string; rotation: string[] }[] = [
  {
    name: "⭐ Beginner — progress first",
    note: "Reliable while leveling; finishes most low/mid recipes, with a little quality at the end.",
    rotation: ["Muscle Memory", "Veneration", "Groundwork", "Groundwork", "Basic Touch", "Standard Touch", "Great Strides", "Byregot's Blessing", "Careful Synthesis"],
  },
  {
    name: "✨ Quality-focused (70 dur)",
    note: "Aims for HQ. Needs decent Control/CP — adjust if you run out of CP or durability.",
    rotation: ["Muscle Memory", "Manipulation", "Veneration", "Waste Not II", "Groundwork", "Groundwork", "Innovation", "Preparatory Touch", "Preparatory Touch", "Great Strides", "Byregot's Blessing", "Careful Synthesis"],
  },
  {
    name: "🍳 Quick food/potion (low CP)",
    note: "Simple, cheap CP. Good for consumables and easy recipes.",
    rotation: ["Muscle Memory", "Veneration", "Groundwork", "Basic Touch", "Standard Touch", "Great Strides", "Byregot's Blessing", "Basic Synthesis"],
  },
];

function makeLine(actionName: string, extraWait: number) {
  const r = resolveAction(actionName);
  const nm = /\s/.test(r.name) ? `"${r.name}"` : r.name;
  return `/ac ${nm} <wait.${r.wait + extraWait}>`;
}

function generate(
  rotation: string[],
  opts: { extraWait: number; mlock: boolean; echo: boolean; breakByregot: boolean; completion: string }
): string[] {
  const reserve = (opts.mlock ? 1 : 0) + (opts.echo ? 1 : 0);
  const perMacro = Math.max(1, 15 - reserve);
  const chunks: string[][] = [];
  let cur: string[] = [];
  for (const a of rotation) {
    const r = resolveAction(a);
    if (opts.breakByregot && r.name === "Byregot's Blessing" && cur.length > 0) {
      chunks.push(cur);
      cur = [];
    }
    if (cur.length >= perMacro) {
      chunks.push(cur);
      cur = [];
    }
    cur.push(makeLine(a, opts.extraWait));
  }
  if (cur.length) chunks.push(cur);

  return chunks.map((lines, i) => {
    const out: string[] = [];
    if (opts.mlock) out.push("/mlock");
    out.push(...lines);
    if (opts.echo) {
      const final = i === chunks.length - 1;
      const se = Math.min(i + 1, 16);
      out.push(final ? `/echo ${opts.completion} <se.${se}>` : `/echo Macro ${i + 1}/${chunks.length} done <se.${se}>`);
    }
    return out.join("\n");
  });
}

export function MacroGenerator() {
  const [rotation, setRotation] = useState<string[]>(PRESETS[0].rotation);
  const [extraWait, setExtraWait] = useState(0);
  const [mlock, setMlock] = useState(false);
  const [echo, setEcho] = useState(true);
  const [breakByregot, setBreakByregot] = useState(false);
  const [completion, setCompletion] = useState("Craft complete!");
  const [copied, setCopied] = useState<number | null>(null);

  const macros = useMemo(
    () => generate(rotation, { extraWait, mlock, echo, breakByregot, completion }),
    [rotation, extraWait, mlock, echo, breakByregot, completion]
  );

  function add(name: string) {
    setRotation((r) => [...r, name]);
  }
  function copy(text: string, i: number) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    });
  }

  return (
    <section className="space-y-3">
      <h3 className="section-title">
        🧪 Crafting macro maker
        <InfoTip text="Build a crafting rotation and turn it into ready-to-paste FFXIV macros. Uses the standard macro format (per-action waits, split into 15-line macros) — the same logic as Teamcraft/ffxiv-craft." />
      </h3>

      {/* how to use */}
      <div className="glass p-4">
        <div className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">How to use (3 steps)</div>
        <ol className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
          <li><strong>1.</strong> Tap a <strong>preset</strong> below for an instant rotation, or build your own by tapping actions.</li>
          <li><strong>2.</strong> Check <strong>Your rotation</strong>, then copy the generated <strong>macro</strong>(s).</li>
          <li><strong>3.</strong> In FFXIV: <strong>System → User Macros</strong>, pick an empty slot, paste, save, and drag it to your hotbar. Run it while crafting.</li>
        </ol>
        <p className="mt-2 rounded-xl bg-amber-100/60 px-3 py-2 text-xs text-amber-700 dark:bg-white/5 dark:text-amber-300">
          ⚠️ Rotations depend on your <strong>Craftsmanship / Control / CP</strong>. Presets are starting points — if a craft fails, you likely need more stats (better gear/food) or a shorter rotation.
        </p>
      </div>

      {/* presets */}
      <div className="glass p-4">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-lavender-500/70 dark:text-lavender-300/60">
          Quick presets
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => setRotation(p.rotation)}
              className="rounded-2xl bg-white/60 p-3 text-left ring-1 ring-inset ring-lavender-200/70 transition hover:bg-white dark:bg-white/5 dark:ring-white/10"
            >
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{p.name}</div>
              <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{p.note}</div>
            </button>
          ))}
        </div>
      </div>

      {/* action palette */}
      <div className="glass p-4">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-lavender-500/70 dark:text-lavender-300/60">
          Add actions (tap to append)
          <InfoTip text="Tap any action to add it to the end of your rotation. Buffs use a 2-second wait, everything else 3 seconds — automatically." />
        </div>
        <div className="space-y-2">
          {CATS.map(({ cat, label, tint }) => (
            <div key={cat}>
              <div className={clsx("mb-1 text-[11px] font-bold", tint)}>{label}</div>
              <div className="flex flex-wrap gap-1.5">
                {CRAFT_ACTIONS.filter((a) => a.cat === cat).map((a) => (
                  <button
                    key={a.name}
                    onClick={() => add(a.name)}
                    title={`Adds /ac "${a.name}" <wait.${a.wait}>`}
                    className="rounded-xl bg-white/70 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-lavender-200/70 transition hover:bg-lavender-100 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10"
                  >
                    {a.emoji} {a.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* current rotation */}
      <div className="glass p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Your rotation ({rotation.length} {rotation.length === 1 ? "step" : "steps"})
          </span>
          <div className="flex gap-2">
            <button onClick={() => setRotation((r) => r.slice(0, -1))} className="btn-ghost !px-2.5 !py-1 text-xs" disabled={!rotation.length}>↶ Undo</button>
            <button onClick={() => setRotation([])} className="btn-ghost !px-2.5 !py-1 text-xs" disabled={!rotation.length}>🗑 Clear</button>
          </div>
        </div>
        {rotation.length === 0 ? (
          <p className="py-2 text-sm text-slate-400">Empty — tap a preset or some actions above.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {rotation.map((a, i) => {
              const r = resolveAction(a);
              return (
                <button
                  key={i}
                  onClick={() => setRotation((rot) => rot.filter((_, j) => j !== i))}
                  title="Remove this step"
                  className={clsx(
                    "group flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ring-1 ring-inset transition",
                    r.known
                      ? "bg-lavender-100 text-lavender-700 ring-lavender-200 hover:bg-rose-100 hover:text-rose-700 dark:bg-white/10 dark:text-lavender-200 dark:ring-white/10"
                      : "bg-amber-100 text-amber-700 ring-amber-200"
                  )}
                >
                  <span className="text-[10px] opacity-60">{i + 1}.</span> {r.name}
                  <span className="opacity-0 group-hover:opacity-100">✕</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* options */}
      <div className="glass grid gap-3 p-4 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-2 text-sm text-slate-700 dark:text-slate-200">
          <span className="flex items-center gap-1.5">Extra wait per step <InfoTip text="Add a second to every action's wait. Use +1 if your macro de-syncs (acts before the previous finishes). Most setups are fine at 0." /></span>
          <select className="field !w-auto" value={extraWait} onChange={(e) => setExtraWait(Number(e.target.value))}>
            <option value={0}>+0</option>
            <option value={1}>+1</option>
            <option value={2}>+2</option>
          </select>
        </label>
        <Toggle label="Sound + notify between macros" tip="Adds /echo with a sound so you know when each macro segment finishes." on={echo} set={setEcho} />
        <Toggle label="Lock macro (/mlock)" tip="Stops you accidentally interrupting the macro by moving — adds /mlock at the top of each macro." on={mlock} set={setMlock} />
        <Toggle label="Split before Byregot's Blessing" tip="Starts a fresh macro right before Byregot's Blessing, a common manual breakpoint." on={breakByregot} set={setBreakByregot} />
        <label className="flex items-center justify-between gap-2 text-sm text-slate-700 dark:text-slate-200 sm:col-span-2">
          <span>Completion message</span>
          <input className="field !w-56" value={completion} onChange={(e) => setCompletion(e.target.value)} />
        </label>
      </div>

      {/* output */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Your macro{macros.length > 1 ? `s (${macros.length} — run them in order)` : ""}
          </h4>
          <InfoTip text="FFXIV macros are limited to 15 lines, so longer rotations split across several macros. Put each on your hotbar and run them in order during the craft." />
        </div>
        {rotation.length === 0 ? (
          <p className="glass p-4 text-sm text-slate-400">Add some actions to generate a macro.</p>
        ) : (
          macros.map((m, i) => (
            <div key={i} className="glass overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/40 px-4 py-2 dark:border-white/10">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Macro {i + 1} of {macros.length}</span>
                <button onClick={() => copy(m, i)} className="btn-primary !px-3 !py-1 text-xs">
                  {copied === i ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>
              <pre className="overflow-x-auto px-4 py-3 text-xs leading-relaxed text-slate-700 dark:text-slate-200">{m}</pre>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Toggle({ label, tip, on, set }: { label: string; tip: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/40 px-3 py-2 dark:bg-white/5">
      <span className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200">{label} <InfoTip text={tip} /></span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => set(!on)}
        className={clsx("relative h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-lavender-500" : "bg-slate-300 dark:bg-white/15")}
      >
        <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", on ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </div>
  );
}
