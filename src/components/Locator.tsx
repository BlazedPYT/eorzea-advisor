"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { coordToPercent, percentToCoord } from "@/lib/coords";
import {
  buildIssueUrl,
  getSubmission,
  removeSubmission,
  saveSubmission,
  type CoordSubmission,
} from "@/lib/coordSubmissions";
import { InfoTip } from "./InfoTip";

type EntryType = "mob" | "npc" | "vendor";
interface SearchHit { key: string; id: number; type: EntryType; name: string; subtitle: string }
interface Point { x: number; y: number }
interface Aetheryte { name: string; x: number; y: number; type: number }
interface Loc {
  mapId: number;
  zone: string;
  points: Point[];
  image: string;
  sizeFactor: number;
  aetheryte: Aetheryte | null;
  approx?: boolean;
}
interface Entry {
  key: string;
  id: number;
  type: EntryType;
  name: string;
  title?: string;
  level?: number | null;
  fate?: boolean;
  locations: Loc[];
}
interface ZoneOption { mapId: number; zone: string; aetheryte: string }

const TYPE_META: Record<EntryType, { label: string; emoji: string; chip: string }> = {
  mob: { label: "Monster", emoji: "👹", chip: "bg-rose-100 text-rose-700 ring-rose-200" },
  vendor: { label: "Vendor", emoji: "🪙", chip: "bg-gold-300/40 text-gold-600 ring-gold-300/60" },
  npc: { label: "NPC", emoji: "🧍", chip: "bg-sky-100 text-sky-700 ring-sky-200" },
};

export function Locator() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [locIdx, setLocIdx] = useState(0);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [currentMapId, setCurrentMapId] = useState<number | "">("");
  const [myPin, setMyPin] = useState<CoordSubmission | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    fetch("/api/bestiary/zones")
      .then((r) => r.json())
      .then((d) => setZones(d.zones ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/bestiary/search?q=${encodeURIComponent(q.trim())}`);
        const d = await res.json();
        if (id === reqId.current) setHits(d.hits ?? []);
      } finally {
        if (id === reqId.current) setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function openEntry(key: string) {
    setLoadingEntry(true);
    setEntry(null);
    setLocIdx(0);
    try {
      const res = await fetch(`/api/bestiary/entry?key=${encodeURIComponent(key)}`);
      const d = await res.json();
      setEntry(d.entry ?? null);
    } finally {
      setLoadingEntry(false);
    }
  }

  const loc = entry?.locations[locIdx];

  // Load this player's own saved pin (if any) whenever the shown location changes.
  useEffect(() => {
    if (!entry || !loc) {
      setMyPin(null);
      return;
    }
    setMyPin(getSubmission(entry.key, loc.mapId));
  }, [entry, loc]);

  const travel = useMemo(() => {
    if (!loc) return null;
    const here = currentMapId !== "" && Number(currentMapId) === loc.mapId;
    const center = loc.points[0];

    // Player pinned this spot themselves — treat it like real coordinates.
    if ((loc.approx || !center) && myPin && myPin.mapId === loc.mapId) {
      const where = `your pinned spot (X: ${myPin.x}, Y: ${myPin.y})`;
      if (here) return { icon: "✅", text: `You're already in ${loc.zone}! Head to ${where}.` };
      if (loc.aetheryte) return { icon: "🔮", text: `Teleport to the ${loc.aetheryte.name} aetheryte in ${loc.zone}, then make your way to ${where}.` };
      return { icon: "🧭", text: `Travel to ${loc.zone}, then head to ${where}.` };
    }

    // Coordinate-less mob: we know the zone, not the exact spot.
    if (loc.approx || !center) {
      if (here) return { icon: "✅", text: `You're already in ${loc.zone}! This monster roams here — its exact spawn isn't recorded in the community map data.` };
      if (loc.aetheryte) return { icon: "🔮", text: `Teleport to the ${loc.aetheryte.name} aetheryte in ${loc.zone}, then explore — exact spawn coordinates aren't recorded for this one.` };
      return { icon: "🧭", text: `Found in ${loc.zone}. Exact spawn coordinates aren't recorded for this monster.` };
    }

    const where = `(X: ${center.x}, Y: ${center.y})`;
    const multi = loc.points.length > 1 ? ` — it appears at ${loc.points.length} spots here` : "";
    if (here) return { icon: "✅", text: `You're already in ${loc.zone}! Head to ${where}${multi}.` };
    if (loc.aetheryte) return { icon: "🔮", text: `Teleport to the ${loc.aetheryte.name} aetheryte in ${loc.zone}, then make your way to ${where}${multi}.` };
    return { icon: "🧭", text: `Travel to ${loc.zone}, then head to ${where}${multi}. (No aetheryte here — you may need a quest, airship or ferry.)` };
  }, [loc, currentMapId, myPin]);

  return (
    <section className="space-y-3">
      <h3 className="section-title">
        🧭 Monster &amp; NPC locator
        <InfoTip text="Type the name of any monster, NPC or vendor to see where it is on the map (marked with an ✕), plus how to get there. Pick where you are for tailored travel directions. Data covers overworld spawns; instanced bosses won't appear." />
      </h3>

      <div className="glass p-4">
        {/* search */}
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔎</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a monster, NPC, or vendor… (e.g. Ruins Runner, Rowena)"
            className="field !rounded-2xl !py-3 !pl-11 text-base"
            spellCheck={false}
          />
          {searching && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-sm text-lavender-400">⏳</span>
          )}
        </div>

        {/* results */}
        {hits.length > 0 && !entry && (
          <ul className="mt-3 max-h-72 space-y-1 overflow-auto pr-1">
            {hits.map((h) => (
              <li key={h.key}>
                <button
                  type="button"
                  onClick={() => openEntry(h.key)}
                  className="flex w-full items-center gap-2.5 rounded-xl bg-white/50 px-3 py-2 text-left transition hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <span className="text-lg">{TYPE_META[h.type].emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{h.name}</span>
                    {h.subtitle && <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{h.subtitle}</span>}
                  </span>
                  <span className={clsx("chip", TYPE_META[h.type].chip)}>{TYPE_META[h.type].label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!searching && q.trim().length >= 2 && hits.length === 0 && !entry && (
          <p className="mt-3 py-2 text-center text-sm text-slate-400">No matches — try another name.</p>
        )}
      </div>

      {/* detail */}
      <AnimatePresence mode="wait">
        {loadingEntry && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass shimmer h-80" />
        )}

        {entry && !loadingEntry && (
          <motion.div
            key={entry.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass space-y-4 p-4"
          >
            {/* header */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{TYPE_META[entry.type].emoji}</span>
                  <h4 className="font-display text-xl font-bold text-slate-800 dark:text-slate-100">{entry.name}</h4>
                  <span className={clsx("chip", TYPE_META[entry.type].chip)}>{TYPE_META[entry.type].label}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                  {entry.title && (
                    <span className="chip bg-lavender-100 text-lavender-700 ring-lavender-200 dark:bg-white/10 dark:text-lavender-200">{entry.title}</span>
                  )}
                  {entry.level ? <span className="chip bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/10 dark:text-slate-200">Lv {entry.level}</span> : null}
                  {entry.fate && <span className="chip bg-orange-100 text-orange-700 ring-orange-200">⚔️ FATE</span>}
                </div>
              </div>
              <button onClick={() => setEntry(null)} className="btn-ghost !px-3 !py-1.5">← Back</button>
            </div>

            {entry.locations.length === 0 && (
              <p className="text-sm text-slate-500">No location data for this one.</p>
            )}

            {entry.locations.length > 0 && loc && (
              <>
                {/* zone switcher */}
                {entry.locations.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {entry.locations.map((l, i) => (
                      <button
                        key={i}
                        onClick={() => setLocIdx(i)}
                        className={clsx(
                          "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                          i === locIdx
                            ? "bg-gradient-to-r from-lavender-500 to-lavender-400 text-white shadow-soft"
                            : "bg-white/60 text-slate-600 ring-1 ring-inset ring-lavender-200/70 hover:bg-white dark:bg-white/5 dark:text-slate-200 dark:ring-white/10"
                        )}
                      >
                        {l.zone}
                      </button>
                    ))}
                  </div>
                )}

                {/* map with X markers */}
                <MapView loc={loc} entry={entry} myPin={myPin} onPinChange={setMyPin} />

                {/* travel */}
                <div className="rounded-2xl bg-gradient-to-br from-lavender-100/70 to-cream-100/60 p-4 dark:from-white/[0.05] dark:to-white/[0.02]">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-lavender-600/80 dark:text-lavender-300/70">
                    🗺️ Travel directions
                    <InfoTip text="Teleporting in FFXIV works from anywhere to any attuned aetheryte. Pick where you are so we can tell you whether you're already in the zone or which aetheryte to teleport to." />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="text-sm text-slate-600 dark:text-slate-300">Where are you?</label>
                    <select
                      value={currentMapId}
                      onChange={(e) => setCurrentMapId(e.target.value ? Number(e.target.value) : "")}
                      className="field sm:max-w-xs"
                    >
                      <option value="">Select your current zone…</option>
                      {zones.map((z) => (
                        <option key={z.mapId} value={z.mapId}>{z.zone}</option>
                      ))}
                    </select>
                  </div>
                  {travel && (
                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-100">
                      {travel.icon} {travel.text}
                    </p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function MapView({
  loc,
  entry,
  myPin,
  onPinChange,
}: {
  loc: Loc;
  entry: Entry;
  myPin: CoordSubmission | null;
  onPinChange: (pin: CoordSubmission | null) => void;
}) {
  const [zoom, setZoom] = useState(false);
  // Coordinate-less location → the player can help map it.
  const mappable = (loc.approx || loc.points.length === 0) && !!loc.image;
  // A draft pin the player is placing/editing before saving (x,y in game coords).
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const name = entry.name;

  if (!loc.image) {
    return (
      <div className="grid h-40 place-items-center rounded-2xl bg-lavender-100/40 text-sm text-slate-400 dark:bg-white/5">
        Map image unavailable for {loc.zone}.
      </div>
    );
  }

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!mappable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = ((e.clientX - rect.left) / rect.width) * 100;
    const fy = ((e.clientY - rect.top) / rect.height) * 100;
    setDraft({
      x: percentToCoord(fx, loc.sizeFactor),
      y: percentToCoord(fy, loc.sizeFactor),
    });
  }

  function saveDraft() {
    if (!draft) return;
    const sub: CoordSubmission = {
      key: entry.key,
      id: entry.id,
      type: entry.type,
      name: entry.name,
      mapId: loc.mapId,
      zone: loc.zone,
      x: draft.x,
      y: draft.y,
      ts: Date.now(),
    };
    saveSubmission(sub);
    onPinChange(sub);
    setDraft(null);
  }

  function clearPin() {
    removeSubmission(entry.key, loc.mapId);
    onPinChange(null);
    setDraft(null);
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{loc.zone}</span>
        <button onClick={() => setZoom((z) => !z)} className="text-[11px] font-semibold text-lavender-600 hover:underline dark:text-lavender-300">
          {zoom ? "− shrink" : "+ enlarge"}
        </button>
      </div>
      <div
        onClick={handleMapClick}
        className={clsx(
          "relative mx-auto overflow-hidden rounded-2xl ring-1 ring-inset ring-lavender-200/60 dark:ring-white/10",
          zoom ? "max-w-2xl" : "max-w-md",
          mappable && "cursor-crosshair"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={loc.image} alt={`${loc.zone} map`} className="block aspect-square w-full object-cover" loading="lazy" />
        {/* markers only when we have real coordinates */}
        {!loc.approx && loc.aetheryte && (
          <Marker x={loc.aetheryte.x} y={loc.aetheryte.y} sizeFactor={loc.sizeFactor} kind="aetheryte" label={loc.aetheryte.name} />
        )}
        {!loc.approx &&
          loc.points.map((p, i) => (
            <Marker key={i} x={p.x} y={p.y} sizeFactor={loc.sizeFactor} kind="target" label={`${name} (${p.x}, ${p.y})`} />
          ))}
        {/* the player's own saved pin */}
        {myPin && myPin.mapId === loc.mapId && !draft && (
          <Marker x={myPin.x} y={myPin.y} sizeFactor={loc.sizeFactor} kind="mine" label={`Your pin (${myPin.x}, ${myPin.y})`} />
        )}
        {/* the in-progress draft pin */}
        {draft && (
          <Marker x={draft.x} y={draft.y} sizeFactor={loc.sizeFactor} kind="draft" label={`(${draft.x}, ${draft.y})`} />
        )}
        {mappable && !myPin && !draft && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-slate-900/70 px-3 py-2 text-center text-[11px] font-semibold text-white">
            Roams {loc.zone} · exact spawn isn’t recorded — tap the map to help pin it
          </div>
        )}
      </div>

      {mappable && (
        <SubmitPanel
          loc={loc}
          myPin={myPin && myPin.mapId === loc.mapId ? myPin : null}
          draft={draft}
          setDraft={setDraft}
          onSave={saveDraft}
          onClear={clearPin}
        />
      )}
    </div>
  );
}

function SubmitPanel({
  loc,
  myPin,
  draft,
  setDraft,
  onSave,
  onClear,
}: {
  loc: Loc;
  myPin: CoordSubmission | null;
  draft: { x: number; y: number } | null;
  setDraft: (d: { x: number; y: number } | null) => void;
  onSave: () => void;
  onClear: () => void;
}) {
  // Numeric coordinate input, clamped to the in-game 1..42 range.
  function setCoord(axis: "x" | "y", raw: string) {
    const n = Math.max(1, Math.min(42, Number(raw) || 1));
    const base = draft ?? (myPin ? { x: myPin.x, y: myPin.y } : { x: 1, y: 1 });
    setDraft({ ...base, [axis]: Math.round(n * 10) / 10 });
  }
  const shown = draft ?? (myPin ? { x: myPin.x, y: myPin.y } : null);

  return (
    <div className="mt-3 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-cream-100/60 p-4 ring-1 ring-inset ring-emerald-200/50 dark:from-white/[0.05] dark:to-white/[0.02] dark:ring-white/10">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/70">
        🧩 Help map this one
        <InfoTip text="Found this monster in-game? Open your map, read the X/Y under your target, then tap that spot on the map above (or type the numbers). It saves on your device right away, and you can send it to the project so we can verify it and add it for everyone." />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {myPin
          ? "Thanks! Your pin is saved on this device. Send it to the project so we can verify and add it for everyone."
          : "Its exact spawn isn’t in our data yet. Tap the map where you found it, or type the X/Y from your in-game map."}
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-sm text-slate-600 dark:text-slate-300">
          <span className="mr-1">X</span>
          <input
            type="number"
            min={1}
            max={42}
            step={0.1}
            value={shown?.x ?? ""}
            onChange={(e) => setCoord("x", e.target.value)}
            placeholder="—"
            className="field !w-20 !py-1.5 text-sm"
          />
        </label>
        <label className="text-sm text-slate-600 dark:text-slate-300">
          <span className="mr-1">Y</span>
          <input
            type="number"
            min={1}
            max={42}
            step={0.1}
            value={shown?.y ?? ""}
            onChange={(e) => setCoord("y", e.target.value)}
            placeholder="—"
            className="field !w-20 !py-1.5 text-sm"
          />
        </label>

        {draft && (
          <button onClick={onSave} className="btn-primary !px-4 !py-1.5 text-sm">
            {myPin ? "Update pin" : "Save pin"}
          </button>
        )}
        {myPin && (
          <a
            href={buildIssueUrl(myPin)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary !px-4 !py-1.5 text-sm"
          >
            Submit to the project ↗
          </a>
        )}
        {(myPin || draft) && (
          <button onClick={onClear} className="btn-ghost !px-3 !py-1.5 text-sm">
            {draft && !myPin ? "Cancel" : "Remove"}
          </button>
        )}
      </div>
    </div>
  );
}

function Marker({
  x,
  y,
  sizeFactor,
  kind,
  label,
}: {
  x: number;
  y: number;
  sizeFactor: number;
  kind: "target" | "aetheryte" | "mine" | "draft";
  label: string;
}) {
  const left = coordToPercent(x, sizeFactor);
  const top = coordToPercent(y, sizeFactor);
  // Pin markers sit on a click-to-place map, so let clicks pass through them.
  const passthrough = kind === "mine" || kind === "draft";
  return (
    <div
      className={clsx(
        "group absolute -translate-x-1/2 -translate-y-1/2",
        passthrough && "pointer-events-none"
      )}
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      {kind === "target" && (
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400/60" />
          <span className="relative text-lg font-black text-rose-600 drop-shadow">✕</span>
        </span>
      )}
      {kind === "aetheryte" && (
        <span className="text-base drop-shadow" title={label}>🔮</span>
      )}
      {kind === "mine" && (
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
          <span className="relative text-lg drop-shadow">📍</span>
        </span>
      )}
      {kind === "draft" && (
        <span className="text-lg drop-shadow animate-bounce">📍</span>
      )}
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900/85 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}
