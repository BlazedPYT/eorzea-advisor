"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings, type Lang } from "./SettingsProvider";
import { Autocomplete, type SuggestItem } from "./Autocomplete";
import { InfoTip } from "./InfoTip";

const LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ja", label: "日本語 (Japanese)" },
  { value: "de", label: "Deutsch (German)" },
  { value: "fr", label: "Français (French)" },
];

const TIMEZONES = [
  { value: "auto", label: "Auto (your device)" },
  { value: "UTC", label: "UTC" },
  { value: "America/Los_Angeles", label: "Pacific (US)" },
  { value: "America/New_York", label: "Eastern (US)" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Central Europe" },
  { value: "Asia/Tokyo", label: "Japan" },
  { value: "Australia/Sydney", label: "Sydney" },
];

function Toggle({
  label,
  tip,
  checked,
  onChange,
}: {
  label: string;
  tip: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/50 px-3 py-2.5 dark:bg-white/5">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-100">
        {label} <InfoTip text={tip} />
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-lavender-500" : "bg-slate-300 dark:bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function MarketSettings() {
  const { settings, update } = useSettings();
  const worldsRef = useRef<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/worlds")
      .then((r) => r.json())
      .then((d) => (worldsRef.current = d.worlds ?? []))
      .catch(() => {});
  }, []);

  async function worldFetcher(q: string): Promise<SuggestItem[]> {
    return worldsRef.current
      .filter((w) => w.toLowerCase().startsWith(q.toLowerCase()))
      .slice(0, 10)
      .map((w) => ({ value: w, label: w }));
  }

  return (
    <section className="space-y-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="section-title hover:opacity-80"
        type="button"
      >
        ⚙️ Marketplace settings
        <span className="text-sm text-slate-400">{open ? "▾" : "▸"}</span>
        <InfoTip text="Your Market Board preferences — the same options as Universalis. They apply across the Market Board lookup, gear prices and the tax panel." />
      </button>

      {open && (
        <div className="glass space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label">
                Your Server{" "}
                <InfoTip text="The world you actually play on. Used as the default for your Home World and to show which listings are on your own server." />
              </label>
              <Autocomplete
                value={settings.yourServer}
                onChange={(v) => update("yourServer", v)}
                fetcher={worldFetcher}
                placeholder="e.g. Gilgamesh"
              />
            </div>

            <div>
              <label className="label">
                Default Home World{" "}
                <InfoTip text="The world Market Board prices are looked up from. We search its whole Data Center for the cheapest cross-world price." />
              </label>
              <Autocomplete
                value={settings.homeWorld}
                onChange={(v) => update("homeWorld", v)}
                fetcher={worldFetcher}
                placeholder="e.g. Gilgamesh"
              />
            </div>

            <div>
              <label className="label">
                Language{" "}
                <InfoTip text="Language for item names in the Market Board search and listings." />
              </label>
              <select
                className="field"
                value={settings.language}
                onChange={(e) => update("language", e.target.value as Lang)}
              >
                {LANGS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                Timezone{" "}
                <InfoTip text="Used when showing exact 'last updated' and 'last sold' times for listings." />
              </label>
              <select
                className="field"
                value={settings.timezone}
                onChange={(e) => update("timezone", e.target.value)}
              >
                {TIMEZONES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle
              label="Left navigation"
              tip="Put the category list on the left side of the Market Board search instead of on top."
              checked={settings.leftNav}
              onChange={(v) => update("leftNav", v)}
            />
            <Toggle
              label="Include tax"
              tip="Add the Market Board tax to displayed prices, so you see roughly what you'd actually pay."
              checked={settings.includeTax}
              onChange={(v) => update("includeTax", v)}
            />
            <Toggle
              label="Hide price cents"
              tip="Round prices to whole gil (hide any decimal places, e.g. when tax is included)."
              checked={settings.hideCents}
              onChange={(v) => update("hideCents", v)}
            />
          </div>
        </div>
      )}
    </section>
  );
}
