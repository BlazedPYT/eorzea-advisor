"use client";

import type { CharacterProfile } from "@/lib/types";
import { getJob, ROLE_LABEL, ROLE_EMOJI } from "@/lib/jobs";
import { storyLabel } from "@/lib/advisor";
import { bracketForLevel } from "@/lib/brackets";
import { resolveExperience, tierMeta } from "@/lib/experience";

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/50 px-3 py-2 dark:bg-white/5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-lavender-500/70 dark:text-lavender-300/60">
        {label}
      </div>
      <div
        className={`truncate font-display text-sm font-bold ${
          accent ? "text-gold-600" : "text-slate-800 dark:text-slate-100"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function CharacterCard({
  profile,
  estItemLevel,
  onEdit,
}: {
  profile: CharacterProfile;
  estItemLevel: number;
  onEdit: () => void;
}) {
  const job = getJob(profile.job);
  const bracket = bracketForLevel(profile.level);
  const tier = tierMeta(resolveExperience(profile));

  return (
    <div className="glass relative overflow-hidden p-5 sm:p-6">
      {/* job-tinted glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl"
        style={{ background: job.color }}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="grid h-16 w-16 place-items-center rounded-3xl text-3xl shadow-soft ring-2 ring-white/60"
            style={{ background: `${job.color}33` }}
          >
            {job.emoji}
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">
              {profile.characterName || "New Adventurer"}
            </h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
              <span className="font-semibold" style={{ color: job.color }}>
                {job.name}
              </span>
              <span>·</span>
              <span>Lv {profile.level}</span>
              <span className="chip bg-lavender-100 text-lavender-700 ring-lavender-200 dark:bg-white/10 dark:text-lavender-200">
                {ROLE_EMOJI[job.role]} {ROLE_LABEL[job.role]}
              </span>
              <span
                className="chip bg-gold-100 text-gold-700 ring-gold-200 dark:bg-gold-400/10 dark:text-gold-300"
                title={tier.blurb}
              >
                {tier.emoji} {tier.label}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onEdit} className="btn-ghost">
          ✎ Edit character
        </button>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="World" value={profile.world || "—"} />
        <Stat label="Gil" value={profile.gil.toLocaleString()} accent />
        <Stat label="Avg item lvl" value={`i${estItemLevel}`} />
        <Stat label="Bracket" value={bracket.expansion} />
        <Stat label="Story" value={storyLabel(profile.msqStatus)} />
        <Stat label="Goal" value={prettyGoal(profile.goal)} />
      </div>
    </div>
  );
}

function prettyGoal(goal: string) {
  return goal
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
