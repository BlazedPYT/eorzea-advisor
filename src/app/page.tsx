"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CharacterProfile, GearItem, GearSnapshotData } from "@/lib/types";
import { buildAdvice } from "@/lib/advisor";
import { DEMO_GEAR_SNAPSHOT, DEMO_PROFILE } from "@/lib/demo";
import { Mascot, MascotBubble } from "@/components/Mascot";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileForm } from "@/components/ProfileForm";
import { CharacterCard } from "@/components/CharacterCard";
import { WhatNextCard } from "@/components/WhatNextCard";
import { GearAdvisor } from "@/components/GearAdvisor";
import {
  FoodReminder,
  GilWarnings,
  LevelingRoute,
  LuxurySuggestions,
  QueueAdvisor,
} from "@/components/AdviceSections";
import { UpdateBanner } from "@/components/UpdateBanner";
import { MarketTax } from "@/components/MarketTax";

const EMPTY_PROFILE: CharacterProfile = {
  characterName: "",
  world: "",
  job: "GLA",
  level: 1,
  gil: 0,
  expansion: "Dawntrail",
  msqStatus: "UNKNOWN",
  storySkipped: false,
  goal: "WHAT_NEXT",
  playstyle: "CASUAL",
};

export default function Home() {
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const [gear, setGear] = useState<GearItem[]>([]);
  const [initialGear, setInitialGear] = useState<GearSnapshotData | null>(null);
  const [mode, setMode] = useState<"loading" | "setup" | "dashboard">("loading");

  // Load the most recently saved profile (if any) on first paint.
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setGear(data.gear?.items ?? []);
          setInitialGear(data.gear ?? null);
          setMode("dashboard");
        } else {
          setMode("setup");
        }
      })
      .catch(() => setMode("setup"));
  }, []);

  const advice = useMemo(
    () => (profile ? buildAdvice(profile) : null),
    [profile]
  );

  async function handleSave(p: CharacterProfile, snapshot?: GearSnapshotData) {
    setProfile(p);
    setGear(snapshot?.items ?? []);
    setInitialGear(snapshot ?? null);
    setMode("dashboard");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: p, gear: snapshot }),
      });
      const data = await res.json();
      if (data.profile?.id) setProfile((prev) => (prev ? { ...prev, id: data.profile.id } : prev));
    } catch {
      /* local state still works even if DB save fails */
    }
  }

  function loadDemo() {
    setProfile(DEMO_PROFILE);
    setGear(DEMO_GEAR_SNAPSHOT.items);
    setInitialGear(DEMO_GEAR_SNAPSHOT);
    setMode("dashboard");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <UpdateBanner />
      {/* header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Mascot size={52} className="drop-shadow" />
          <div>
            <h1 className="font-display text-2xl font-bold leading-none text-slate-800 dark:text-slate-50">
              Eorzea Advisor
            </h1>
            <p className="text-xs text-lavender-600/80 dark:text-lavender-300/80">
              your cozy FFXIV companion · any job · any level
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === "dashboard" && (
            <button className="btn-ghost" onClick={() => setMode("setup")}>
              ✎ Edit
            </button>
          )}
          <button className="btn-ghost" onClick={loadDemo} title="Load the Scholar 54 demo">
            🎀 Demo
          </button>
          <ThemeToggle />
        </div>
      </header>

      {mode === "loading" && (
        <div className="grid place-items-center py-32">
          <Mascot size={96} />
          <p className="mt-3 animate-pulse text-sm font-semibold text-lavender-600">
            Summoning your adventurer…
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {mode === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-5">
              <MascotBubble>
                Hi! I’m <strong>Gilbo</strong> 👋 Tell me about your character and I’ll
                sort out your gear, queues, food and gil — even if you used a story
                skip. Not sure? Tap <strong>Demo</strong> up top.
              </MascotBubble>
            </div>
            <ProfileForm
              initial={profile ?? EMPTY_PROFILE}
              initialGear={initialGear}
              onSave={handleSave}
              onCancel={profile ? () => setMode("dashboard") : undefined}
            />
          </motion.div>
        )}

        {mode === "dashboard" && profile && advice && (
          <motion.div
            key="dash"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <CharacterCard
              profile={profile}
              estItemLevel={advice.estimatedItemLevel}
              onEdit={() => setMode("setup")}
            />

            {advice.storyNote && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass border-l-4 border-l-amber-400 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📖</span>
                  <div>
                    <div className="font-display font-bold text-amber-600">
                      Your story is ahead of your level
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                      {advice.storyNote}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <WhatNextCard whatNext={advice.whatNext} />

            <GearAdvisor profile={profile} equipped={gear} />

            <div className="grid gap-6 lg:grid-cols-2">
              <QueueAdvisor queue={advice.queue} />
              <LevelingRoute route={advice.route} />
            </div>

            <FoodReminder food={advice.food} />
            <MarketTax world={profile.world} />
            <GilWarnings warnings={advice.gilWarnings} />
            <LuxurySuggestions luxury={advice.luxury} />
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-16 border-t border-lavender-200/50 pt-6 text-center text-xs text-slate-400 dark:border-white/10">
        <p>
          Eorzea Advisor reads only public Lodestone pages, XIVAPI static game data,
          and Universalis market prices. No plugins, no memory readers — fully within
          the FFXIV third-party tool policy. Gear snapshots may be delayed.
        </p>
        <p className="mt-1">
          Not affiliated with Square Enix. FINAL FANTASY XIV © SQUARE ENIX. Mascot
          “Gilbo” is original art. Made with 💜 for adventurers.
        </p>
      </footer>
    </main>
  );
}
