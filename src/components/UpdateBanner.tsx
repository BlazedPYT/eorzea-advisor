"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Bridges to the Electron preload (window.eorzea). On the web it renders
// nothing. In the desktop app it shows a "pending update" banner the user can
// click to install.
type EorzeaBridge = {
  isDesktop?: boolean;
  onUpdateAvailable: (cb: (d: { version?: string }) => void) => void;
  onUpdateProgress: (cb: (d: { percent: number }) => void) => void;
  onUpdateDownloaded: (cb: (d: { version?: string }) => void) => void;
  onUpdateError: (cb: (d: { message: string }) => void) => void;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
};

declare global {
  interface Window {
    eorzea?: EorzeaBridge;
  }
}

type Phase = "idle" | "available" | "downloading" | "ready";

export function UpdateBanner() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [version, setVersion] = useState<string | undefined>();
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const api = typeof window !== "undefined" ? window.eorzea : undefined;
    if (!api?.isDesktop) return;

    api.onUpdateAvailable((d) => {
      setVersion(d.version);
      setPhase("downloading");
    });
    api.onUpdateProgress((d) => setPercent(d.percent));
    api.onUpdateDownloaded((d) => {
      setVersion(d.version);
      setPhase("ready");
    });
  }, []);

  if (phase === "idle") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
      >
        <div className="glass flex w-full max-w-2xl items-center gap-3 px-4 py-3 shadow-soft">
          <span className="text-xl">{phase === "ready" ? "🎉" : "⬇️"}</span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-sm font-bold text-slate-800 dark:text-slate-100">
              {phase === "ready"
                ? `Update ready${version ? ` (v${version})` : ""}!`
                : `Downloading update${version ? ` v${version}` : ""}…`}
            </div>
            {phase === "downloading" ? (
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-lavender-200/60 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lavender-500 to-lavender-400 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Restart to apply the latest version.
              </p>
            )}
          </div>
          {phase === "ready" && (
            <button
              className="btn-primary shrink-0"
              onClick={() => window.eorzea?.installUpdate()}
            >
              Update now
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
