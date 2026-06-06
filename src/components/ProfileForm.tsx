"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type {
  CharacterProfile,
  GearItem,
  GearSnapshotData,
  Goal,
  MsqStatus,
  Playstyle,
} from "@/lib/types";
import { JobSelector } from "./JobSelector";
import { LevelSelector } from "./LevelSelector";
import { ALL_SLOTS, SLOT_LABEL } from "@/lib/gear";
import { getJob } from "@/lib/jobs";

const MSQ_OPTIONS: { value: MsqStatus; label: string }[] = [
  { value: "NORMAL", label: "Normal progression" },
  { value: "SKIP_ARR", label: "Story skipped → A Realm Reborn" },
  { value: "SKIP_HW", label: "Story skipped → Heavensward" },
  { value: "SKIP_SB", label: "Story skipped → Stormblood" },
  { value: "SKIP_SHB", label: "Story skipped → Shadowbringers" },
  { value: "SKIP_EW", label: "Story skipped → Endwalker / pre-Dawntrail" },
  { value: "IN_DAWNTRAIL", label: "Currently in Dawntrail" },
  { value: "UNKNOWN", label: "Unknown / let app estimate" },
];

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "SPEED_LEVELING", label: "⚡ Speed Leveling" },
  { value: "GEAR_UPGRADE", label: "🛡️ Gear Upgrade" },
  { value: "GLAMOUR", label: "✨ Glamour" },
  { value: "MOUNT_SHOPPING", label: "🐎 Mount Shopping" },
  { value: "GIL_SAVING", label: "🪙 Gil Saving" },
  { value: "FRESH_RETURNER", label: "🌱 Fresh Returner Help" },
  { value: "WHAT_NEXT", label: "❓ What Should I Do Next?" },
];

const PLAYSTYLE_OPTIONS: { value: Playstyle; label: string }[] = [
  { value: "FASTEST", label: "Fastest leveling" },
  { value: "CASUAL", label: "Casual leveling" },
  { value: "SAFE_PRACTICE", label: "Safe healer/tank practice" },
  { value: "DPS_OPTIMIZE", label: "DPS queue optimization" },
];

const EXPANSIONS = [
  "A Realm Reborn",
  "Heavensward",
  "Stormblood",
  "Shadowbringers",
  "Endwalker",
  "Dawntrail",
];

export function ProfileForm({
  initial,
  initialGear,
  onSave,
  onCancel,
}: {
  initial: CharacterProfile;
  initialGear?: GearSnapshotData | null;
  onSave: (profile: CharacterProfile, gear?: GearSnapshotData) => void;
  onCancel?: () => void;
}) {
  const [p, setP] = useState<CharacterProfile>(initial);
  const [gear, setGear] = useState<GearItem[]>(initialGear?.items ?? []);
  const [gearSource, setGearSource] = useState<"LODESTONE" | "MANUAL">(
    initialGear?.source ?? "MANUAL"
  );
  const [showManualGear, setShowManualGear] = useState(false);

  // Lodestone sync state
  const [lodestoneInput, setLodestoneInput] = useState(initial.lodestoneUrl ?? "");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncWarn, setSyncWarn] = useState<string | null>(null);

  function set<K extends keyof CharacterProfile>(key: K, value: CharacterProfile[K]) {
    setP((prev) => ({ ...prev, [key]: value }));
  }

  function setGearSlot(slot: GearItem["slot"], name: string) {
    setGear((prev) => {
      const others = prev.filter((g) => g.slot !== slot);
      if (!name.trim()) return others;
      return [...others, { slot, name: name.trim() }];
    });
  }

  async function runLodestoneSync() {
    setSyncing(true);
    setSyncMsg(null);
    setSyncWarn(null);
    try {
      const isUrl = /lodestone\/character\/\d+/.test(lodestoneInput);
      const res = await fetch("/api/lodestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isUrl
            ? { url: lodestoneInput }
            : { name: p.characterName, world: p.world }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setSyncMsg(data.error ?? "Sync failed. Try Manual Mode.");
        return;
      }
      setGear(data.items ?? []);
      setGearSource("LODESTONE");
      setShowManualGear(true);
      setP((prev) => ({
        ...prev,
        characterName: data.name ?? prev.characterName,
        world: data.world ?? prev.world,
        level: data.activeJobLevel ?? prev.level,
        lodestoneId: data.id,
        lodestoneUrl: data.url,
      }));
      setSyncMsg(`Synced ${data.items?.length ?? 0} gear slots from Lodestone.`);
      setSyncWarn(data.warning ?? null);
    } catch {
      setSyncMsg("Network error. Please use Manual Mode.");
    } finally {
      setSyncing(false);
    }
  }

  function submit() {
    const snapshot: GearSnapshotData | undefined = gear.length
      ? {
          source: gearSource,
          stale: false,
          fetchedAt: new Date().toISOString(),
          items: gear,
        }
      : undefined;
    onSave(p, snapshot);
  }

  const gearBySlot = new Map(gear.map((g) => [g.slot, g.name]));
  const job = getJob(p.job);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass space-y-6 p-5 sm:p-7"
    >
      <div>
        <h2 className="section-title">🧭 Character Profile Setup</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tell Gilbo about your character. Everything is tracked separately — your
          job level, your story, and your gear don’t have to match.
        </p>
      </div>

      {/* identity */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label">Character name</label>
          <input
            className="field"
            value={p.characterName}
            placeholder="e.g. Aria Lumenfield"
            onChange={(e) => set("characterName", e.target.value)}
          />
        </div>
        <div>
          <label className="label">World / server</label>
          <input
            className="field"
            value={p.world}
            placeholder="e.g. Gilgamesh"
            onChange={(e) => set("world", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Current gil</label>
          <input
            type="number"
            className="field"
            value={p.gil}
            min={0}
            onChange={(e) => set("gil", Number(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* job + level */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass !rounded-2xl !bg-white/40 p-4 dark:!bg-white/[0.03]">
          <label className="label">Combat job / class</label>
          <JobSelector value={p.job} onChange={(id) => set("job", id)} />
          {job.startingLevel > p.level && (
            <p className="mt-2 text-xs font-semibold text-rose-500">
              Heads up: {job.name} starts at level {job.startingLevel}.
            </p>
          )}
        </div>
        <div className="glass !rounded-2xl !bg-white/40 p-4 dark:!bg-white/[0.03]">
          <label className="label">Current level</label>
          <LevelSelector value={p.level} onChange={(l) => set("level", l)} />
        </div>
      </div>

      {/* story / goal / playstyle */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Expansion access</label>
          <select
            className="field"
            value={p.expansion}
            onChange={(e) => set("expansion", e.target.value)}
          >
            {EXPANSIONS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">MSQ / story status</label>
          <select
            className="field"
            value={p.msqStatus}
            onChange={(e) => {
              const v = e.target.value as MsqStatus;
              set("msqStatus", v);
              set("storySkipped", v.startsWith("SKIP_"));
            }}
          >
            {MSQ_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Goal</label>
          <select
            className="field"
            value={p.goal}
            onChange={(e) => set("goal", e.target.value as Goal)}
          >
            {GOAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Preferred playstyle</label>
          <select
            className="field"
            value={p.playstyle}
            onChange={(e) => set("playstyle", e.target.value as Playstyle)}
          >
            {PLAYSTYLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lodestone sync */}
      <div className="rounded-2xl border border-lavender-200/60 bg-lavender-50/50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔗</span>
          <h3 className="font-bold text-slate-700 dark:text-slate-100">
            Lodestone Gear Sync
          </h3>
          <span className="chip bg-amber-100 text-amber-700 ring-amber-200">
            may be delayed
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Paste a Lodestone character URL, or fill name + world above and sync by
          name. This reads your <strong>public</strong> profile only — no plugins,
          no memory readers. Lodestone updates when you log out, so gear can be
          stale; override anything below.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="field"
            placeholder="https://na.finalfantasyxiv.com/lodestone/character/…"
            value={lodestoneInput}
            onChange={(e) => setLodestoneInput(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary shrink-0"
            onClick={runLodestoneSync}
            disabled={syncing}
          >
            {syncing ? "Syncing…" : "Sync from Lodestone"}
          </button>
        </div>
        {syncMsg && (
          <p className="mt-2 text-xs font-semibold text-lavender-700 dark:text-lavender-200">
            {syncMsg}
          </p>
        )}
        {syncWarn && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">⚠️ {syncWarn}</p>
        )}
      </div>

      {/* Manual gear override */}
      <div>
        <button
          type="button"
          onClick={() => setShowManualGear((s) => !s)}
          className="btn-ghost"
        >
          {showManualGear ? "▾" : "▸"} Manual gear override{" "}
          {gear.length ? `(${gear.length} slots)` : ""}
        </button>
        {showManualGear && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_SLOTS.map((slot) => (
              <div key={slot}>
                <label className="label">{SLOT_LABEL[slot]}</label>
                <input
                  className="field"
                  placeholder="item name (optional)"
                  value={gearBySlot.get(slot) ?? ""}
                  onChange={(e) => setGearSlot(slot, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="button" className="btn-primary" onClick={submit}>
          💾 Save & get advice
        </button>
      </div>
    </motion.div>
  );
}
