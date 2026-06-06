"use client";

import { JOBS_BY_ROLE } from "@/lib/jobs";
import { ROLE_LABEL } from "@/lib/jobs";
import clsx from "clsx";

export function JobSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (jobId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {JOBS_BY_ROLE.map(({ role, jobs }) => (
        <div key={role}>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-lavender-500/70 dark:text-lavender-300/60">
            {ROLE_LABEL[role]}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {jobs.map((job) => {
              const active = job.id === value;
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => onChange(job.id)}
                  className={clsx(
                    "group flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset transition-all",
                    active
                      ? "bg-gradient-to-r from-lavender-500 to-lavender-400 text-white ring-transparent shadow-soft scale-[1.03]"
                      : "bg-white/70 text-slate-600 ring-lavender-200/70 hover:bg-white hover:ring-lavender-300 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10"
                  )}
                  title={job.name}
                >
                  <span>{job.emoji}</span>
                  <span>{job.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
