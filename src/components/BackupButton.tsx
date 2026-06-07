"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// The localStorage keys that make up a user's saved state.
const KEYS = ["ea-profile", "ea-market-settings-v1", "ea-checklist-v1", "ea-theme", "ea-coord-submissions-v1"];
const PREFIX = "EA1-";

function makeCode(): string {
  const data: Record<string, string> = {};
  for (const k of KEYS) {
    const v = localStorage.getItem(k);
    if (v != null) data[k] = v;
  }
  const json = JSON.stringify({ v: 1, data });
  // unicode-safe base64
  return PREFIX + btoa(unescape(encodeURIComponent(json)));
}

function applyCode(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed.startsWith(PREFIX)) return false;
  try {
    const json = decodeURIComponent(escape(atob(trimmed.slice(PREFIX.length))));
    const parsed = JSON.parse(json);
    if (!parsed?.data) return false;
    for (const k of KEYS) {
      if (typeof parsed.data[k] === "string") localStorage.setItem(k, parsed.data[k]);
    }
    return true;
  } catch {
    return false;
  }
}

export function BackupButton() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function openModal() {
    setCode(makeCode());
    setImportText("");
    setMsg(null);
    setCopied(false);
    setOpen(true);
  }

  function copy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function download() {
    const blob = new Blob([code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "eorzea-advisor-backup.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function restore() {
    if (applyCode(importText)) {
      setMsg("✅ Restored! Reloading…");
      setTimeout(() => window.location.reload(), 800);
    } else {
      setMsg("❌ That doesn't look like a valid backup code.");
    }
  }

  return (
    <>
      <button className="btn-ghost" onClick={openModal} title="Back up or restore your data">
        ⇄ Backup
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          >
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-lg space-y-4 rounded-t-3xl p-5 sm:rounded-3xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-100">⇄ Backup &amp; restore</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No account needed — copy this code to move your character, settings, theme and
                    checklist to another device or browser.
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="btn-ghost !rounded-full !px-3 !py-1.5">✕</button>
              </div>

              {/* export */}
              <div>
                <div className="label">Your backup code</div>
                <textarea readOnly value={code} rows={3} className="field font-mono text-[11px]" onFocus={(e) => e.currentTarget.select()} />
                <div className="mt-2 flex gap-2">
                  <button className="btn-primary" onClick={copy}>{copied ? "✓ Copied!" : "📋 Copy code"}</button>
                  <button className="btn-ghost" onClick={download}>⬇ Save as file</button>
                </div>
              </div>

              <div className="h-px bg-lavender-200/50 dark:bg-white/10" />

              {/* import */}
              <div>
                <div className="label">Restore from a code</div>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={3}
                  placeholder="Paste a backup code here…"
                  className="field font-mono text-[11px]"
                />
                <div className="mt-2 flex items-center gap-3">
                  <button className="btn-primary" onClick={restore} disabled={!importText.trim()}>♻️ Restore</button>
                  {msg && <span className="text-xs font-semibold text-slate-600 dark:text-slate-200">{msg}</span>}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Restoring overwrites this device's saved data and reloads the app.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
