"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type {
  CharacterProfile,
  ExperienceTier,
  GearItem,
  GearSnapshotData,
  Goal,
  MsqStatus,
  Playstyle,
} from "@/lib/types";
import { JobSelector } from "./JobSelector";
import { LevelSelector } from "./LevelSelector";
import { Autocomplete, type SuggestItem } from "./Autocomplete";
import { InfoTip } from "./InfoTip";
import { ALL_SLOTS, SLOT_LABEL } from "@/lib/gear";
import { getJob } from "@/lib/jobs";
import {
  EXPERIENCE_TIERS,
  defaultExperienceForLevel,
  tierMeta,
} from "@/lib/experience";

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

  // World list for the world autocomplete (loaded once).
  const worldsRef = useRef<string[]>([]);
  useEffect(() => {
    fetch("/api/worlds")
      .then((r) => r.json())
      .then((d) => (worldsRef.current = d.worlds ?? []))
      .catch(() => {});
  }, []);

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

  // Suggestion fetchers for the autocompletes.
  async function fetchWorlds(q: string): Promise<SuggestItem[]> {
    const all = worldsRef.current;
    return all
      .filter((w) => w.toLowerCase().startsWith(q.toLowerCase()))
      .slice(0, 10)
      .map((w) => ({ value: w, label: w }));
  }

  async function fetchCharacters(q: string): Promise<SuggestItem[]> {
    const params = new URLSearchParams({ name: q });
    if (p.world) params.set("world", p.world);
    const res = await fetch(`/api/lodestone/search?${params.toString()}`);
    const data = await res.json();
    return (data.matches ?? []).map((m: any) => ({
      value: m.name,
      label: m.name,
      sublabel: m.dc ? `${m.world} · ${m.dc}` : m.world,
      avatar: m.avatar,
      data: m,
    }));
  }

  async function doSync(body: { url?: string; name?: string; world?: string }) {
    setSyncing(true);
    setSyncMsg(null);
    setSyncWarn(null);
    try {
      const res = await fetch("/api/lodestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      if (data.url) setLodestoneInput(data.url);
      setSyncMsg(`Synced ${data.items?.length ?? 0} gear slots from Lodestone.`);
      setSyncWarn(data.warning ?? null);
    } catch {
      setSyncMsg("Network error. Please use Manual Mode.");
    } finally {
      setSyncing(false);
    }
  }

  function runLodestoneSync() {
    const isUrl = /lodestone\/character\/\d+/.test(lodestoneInput);
    return doSync(isUrl ? { url: lodestoneInput } : { name: p.characterName, world: p.world });
  }

  // Picking a character from the name suggestions auto-syncs that exact profile.
  function onPickCharacter(item: SuggestItem) {
    const m = item.data as { id?: string; world?: string } | undefined;
    if (m?.world) set("world", m.world);
    if (m?.id) doSync({ url: `https://na.finalfantasyxiv.com/lodestone/character/${m.id}/` });
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
          <label className="label">
            Character name{" "}
            <InfoTip text="Type your in-game character name. We search the Lodestone live as you type — pick yourself from the list and we'll auto-load your job, level and gear. (Set your World first for the best matches.)" />
          </label>
          <Autocomplete
            value={p.characterName}
            onChange={(v) => set("characterName", v)}
            onSelect={onPickCharacter}
            fetcher={fetchCharacters}
            minChars={3}
            placeholder="Start typing your character name…"
            emptyHint="No characters found yet — keep typing, or set your World first."
          />
          <p className="mt-1 text-[11px] text-slate-400">
            🔎 Searches the Lodestone live — pick yourself and we’ll load your gear
            automatically.
          </p>
        </div>
        <div>
          <label className="label">
            World / server{" "}
            <InfoTip text="Your home World (e.g. Gilgamesh). Start typing and pick from the list. We use your World's Data Center to find the cheapest cross-world Market Board prices." />
          </label>
          <Autocomplete
            value={p.world}
            onChange={(v) => set("world", v)}
            fetcher={fetchWorlds}
            minChars={1}
            placeholder="e.g. Gilgamesh"
          />
        </div>
        <div>
          <label className="label">
            Current gil{" "}
            <InfoTip text="How much gil (the game's currency) you have. Check it at the bottom of your inventory window in-game. We use this to flag when something is too expensive for you." />
          </label>
          <input
            inputMode="numeric"
            className="field"
            value={p.gil ? p.gil.toLocaleString() : ""}
            placeholder="0"
            onChange={(e) => {
              const digits = e.target.value.replace(/[^\d]/g, "");
              set("gil", digits ? Number(digits) : 0);
            }}
          />
        </div>
      </div>

      {/* job + level */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass !rounded-2xl !bg-white/40 p-4 dark:!bg-white/[0.03]">
          <label className="label">
            Combat job / class{" "}
            <InfoTip text="The job you want advice for. In FFXIV one character can be every job — switch by equipping that job's weapon/soul crystal. Pick the one you're leveling now; all advice retargets to it." />
          </label>
          <JobSelector value={p.job} onChange={(id) => set("job", id)} />
          {job.startingLevel > p.level && (
            <p className="mt-2 text-xs font-semibold text-rose-500">
              Heads up: {job.name} starts at level {job.startingLevel}.
            </p>
          )}
        </div>
        <div className="glass !rounded-2xl !bg-white/40 p-4 dark:!bg-white/[0.03]">
          <label className="label">
            This job's level{" "}
            <InfoTip text="The level of the job selected above (1–100), not your character's highest. Each job levels separately. Drag the slider or tap a milestone. The colored label shows your gearing bracket." />
          </label>
          <LevelSelector value={p.level} onChange={(l) => set("level", l)} />
        </div>
      </div>

      {/* experience tier */}
      <div className="glass !rounded-2xl !bg-white/40 p-4 dark:!bg-white/[0.03]">
        <label className="label">
          Experience level{" "}
          <InfoTip text="How seasoned YOU are as a player — separate from your character's level. A level-90 newcomer and a veteran on a fresh alt get different advice. Leave it on Auto to follow your level, or override it. Beginners get extra explanations; Veterans get terser tips; Endgame opens the max-level (raids/relics) section." />
        </label>
        <select
          className="field"
          value={p.experience ?? "AUTO"}
          onChange={(e) => {
            const v = e.target.value;
            set("experience", v === "AUTO" ? undefined : (v as ExperienceTier));
          }}
        >
          <option value="AUTO">
            ✨ Auto — from level (currently {tierMeta(defaultExperienceForLevel(p.level)).label})
          </option>
          {EXPERIENCE_TIERS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.emoji} {t.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          {tierMeta(p.experience ?? defaultExperienceForLevel(p.level)).blurb}
        </p>
      </div>

      {/* story / goal / playstyle */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">
            Expansion access{" "}
            <InfoTip text="The latest expansion you own (A Realm Reborn → Dawntrail). This caps how high you can level and which content exists for you." />
          </label>
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
          <label className="label">
            MSQ / story status{" "}
            <InfoTip text="How far you are in the Main Scenario Quest — and whether you used a story 'skip' (a paid jump). This matters: a skip can unlock content your job is too low to do, so we tailor advice around that." />
          </label>
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
          <label className="label">
            Goal{" "}
            <InfoTip text="What you want help with right now. Your dashboard opens focused on this — e.g. Speed Leveling jumps to dailies/route, Gear Upgrade opens the gear advisor." />
          </label>
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
          <label className="label">
            Preferred playstyle{" "}
            <InfoTip text="How you like to play — tunes the tips. e.g. 'Safe healer/tank practice' adds gentle pointers; 'DPS queue optimization' reminds you to stack queues since DPS waits are longest." />
          </label>
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
