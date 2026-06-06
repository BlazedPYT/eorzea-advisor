"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface UpdateState {
  status: "idle" | "dev" | "checking" | "downloading" | "downloaded" | "none" | "error";
  version?: string | null;
  percent?: number;
  message?: string;
}

type EorzeaBridge = {
  isDesktop?: boolean;
  getUpdateState: () => Promise<UpdateState>;
  onUpdateState: (cb: (s: UpdateState) => void) => void;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
};

declare global {
  interface Window {
    eorzea?: EorzeaBridge;
  }
}

export function UpdateBanner() {
  const [state, setState] = useState<UpdateState>({ status: "idle" });

  useEffect(() => {
    const api = typeof window !== "undefined" ? window.eorzea : undefined;
    if (!api?.isDesktop) return;
    api.onUpdateState(setState);
    api.getUpdateState().then(setState).catch(() => {});
  }, []);

  const visible = state.status === "downloading" || state.status === "downloaded";
  if (!visible) return null;

  const ready = state.status === "downloaded";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
      >
        <div className="glass flex w-full max-w-2xl items-center gap-3 px-4 py-3 shadow-soft">
          <span className="text-xl">{ready ? "🎉" : "⬇️"}</span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-sm font-bold text-slate-800 dark:text-slate-100">
              {ready
                ? `Update ready${state.version ? ` (v${state.version})` : ""}!`
                : `Downloading update${state.version ? ` v${state.version}` : ""}… ${state.percent ?? 0}%`}
            </div>
            {ready ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Restart to apply the latest version.
              </p>
            ) : (
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-lavender-200/60 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lavender-500 to-lavender-400 transition-all"
                  style={{ width: `${state.percent ?? 0}%` }}
                />
              </div>
            )}
          </div>
          {ready && (
            <button className="btn-primary shrink-0" onClick={() => window.eorzea?.installUpdate()}>
              Update now
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
