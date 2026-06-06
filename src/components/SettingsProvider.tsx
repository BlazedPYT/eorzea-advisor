"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Lang = "en" | "ja" | "de" | "fr";

export interface MarketSettings {
  yourServer: string; // the world you actually play on
  homeWorld: string; // Default Home World — drives Market Board queries
  language: Lang; // item-name language
  timezone: string; // "auto" or an IANA tz
  leftNav: boolean; // category nav on the left in the Market Board
  includeTax: boolean; // show prices with Market Board tax added
  hideCents: boolean; // hide decimal places on prices
}

const DEFAULTS: MarketSettings = {
  yourServer: "",
  homeWorld: "",
  language: "en",
  timezone: "auto",
  leftNav: false,
  includeTax: false,
  hideCents: true,
};

const KEY = "ea-market-settings-v1";

interface Ctx {
  settings: MarketSettings;
  update: <K extends keyof MarketSettings>(k: K, v: MarketSettings[K]) => void;
  taxRate: number; // current min MB tax % for the home world (for Include Tax)
  /** Format a gil amount applying Include Tax + Hide Cents. */
  fmt: (n?: number) => string;
  /** Format a timestamp (ms) in the chosen timezone. */
  fmtTime: (ms?: number) => string;
}

const SettingsCtx = createContext<Ctx | null>(null);

export function useSettings(): Ctx {
  const ctx = useContext(SettingsCtx);
  if (ctx) return ctx;
  // Safe fallback when used outside a provider (e.g. web preview).
  return {
    settings: DEFAULTS,
    update: () => {},
    taxRate: 0,
    fmt: (n) => (n && n > 0 ? n.toLocaleString() : "—"),
    fmtTime: (ms) => (ms ? new Date(ms).toLocaleString() : ""),
  };
}

export function SettingsProvider({
  initialWorld,
  children,
}: {
  initialWorld?: string;
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<MarketSettings>(DEFAULTS);
  const [taxRate, setTaxRate] = useState(0);

  // Load persisted settings, seeding the world from the active profile.
  useEffect(() => {
    let loaded: Partial<MarketSettings> = {};
    try {
      loaded = JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {
      loaded = {};
    }
    setSettings({
      ...DEFAULTS,
      yourServer: loaded.yourServer || initialWorld || "",
      homeWorld: loaded.homeWorld || initialWorld || "",
      language: loaded.language || "en",
      timezone: loaded.timezone || "auto",
      leftNav: loaded.leftNav ?? false,
      includeTax: loaded.includeTax ?? false,
      hideCents: loaded.hideCents ?? true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWorld]);

  const update = useCallback<Ctx["update"]>((k, v) => {
    setSettings((prev) => {
      const next = { ...prev, [k]: v };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Pull the home world's current MB tax (min city rate) for Include Tax.
  useEffect(() => {
    if (!settings.homeWorld) return;
    let cancelled = false;
    fetch(`/api/universalis/tax?world=${encodeURIComponent(settings.homeWorld)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const rate = d?.lowest?.rate;
        setTaxRate(typeof rate === "number" ? rate : 5);
      })
      .catch(() => !cancelled && setTaxRate(5));
    return () => {
      cancelled = true;
    };
  }, [settings.homeWorld]);

  const fmt = useCallback(
    (n?: number) => {
      if (n == null || n <= 0) return "—";
      let v = n;
      if (settings.includeTax) v = v * (1 + taxRate / 100);
      return settings.hideCents
        ? Math.round(v).toLocaleString()
        : v.toLocaleString(undefined, { maximumFractionDigits: 2 });
    },
    [settings.includeTax, settings.hideCents, taxRate]
  );

  const fmtTime = useCallback(
    (ms?: number) => {
      if (!ms) return "";
      const opts: Intl.DateTimeFormatOptions = {
        dateStyle: "medium",
        timeStyle: "short",
        ...(settings.timezone !== "auto" ? { timeZone: settings.timezone } : {}),
      };
      try {
        return new Intl.DateTimeFormat(undefined, opts).format(ms);
      } catch {
        return new Date(ms).toLocaleString();
      }
    },
    [settings.timezone]
  );

  return (
    <SettingsCtx.Provider value={{ settings, update, taxRate, fmt, fmtTime }}>
      {children}
    </SettingsCtx.Provider>
  );
}
