import type {
  AdvisorResult,
  CharacterProfile,
  GilWarning,
  Goal,
  LuxuryRec,
  MsqStatus,
  QueueRec,
  RouteStep,
} from "./types";
import { getJob, ROLE_LABEL } from "./jobs";
import { bracketForLevel, estimateItemLevel } from "./brackets";
import { resolveExperience } from "./experience";
import {
  LEVELING_DUNGEONS,
  highestDungeonForLevel,
  nextDungeonAfter,
} from "./dungeons";
import { foodAdvice } from "./food";

// ---------------------------------------------------------------------------
// The non-gear half of the advisor: queue, route, story logic, food, gil
// warnings, luxury, and the headline "What should I do next?". Pure + sync so
// it runs instantly on the client; gear (which needs network) is separate.
// ---------------------------------------------------------------------------

// The job level required to *continue* a skipped story line.
const STORY_GATE: Record<MsqStatus, number | null> = {
  NORMAL: null,
  SKIP_ARR: 50,
  SKIP_HW: 60,
  SKIP_SB: 70,
  SKIP_SHB: 80,
  SKIP_EW: 90,
  IN_DAWNTRAIL: 100,
  UNKNOWN: null,
};

const STORY_LABEL: Record<MsqStatus, string> = {
  NORMAL: "Normal progression",
  SKIP_ARR: "Skipped → A Realm Reborn",
  SKIP_HW: "Skipped → Heavensward",
  SKIP_SB: "Skipped → Stormblood",
  SKIP_SHB: "Skipped → Shadowbringers",
  SKIP_EW: "Skipped → Endwalker (pre-Dawntrail)",
  IN_DAWNTRAIL: "Currently in Dawntrail",
  UNKNOWN: "Unknown / estimated",
};

export function storyLabel(s: MsqStatus): string {
  return STORY_LABEL[s];
}

function isStorySkipped(p: CharacterProfile): boolean {
  return (
    p.storySkipped ||
    ["SKIP_ARR", "SKIP_HW", "SKIP_SB", "SKIP_SHB", "SKIP_EW"].includes(
      p.msqStatus
    )
  );
}

// Is the player's story unlocked further than their job can currently handle?
function storyAheadOfLevel(p: CharacterProfile): { ahead: boolean; gate: number | null } {
  const gate = STORY_GATE[p.msqStatus];
  if (gate == null) return { ahead: false, gate: null };
  return { ahead: p.level < gate, gate };
}

// Roughly: has the player unlocked the Leveling Roulette? It opens once you've
// run a low-level dungeon. Skips guarantee it; otherwise assume yes past 16.
function levelingRouletteUnlocked(p: CharacterProfile): boolean {
  return isStorySkipped(p) || p.level >= 16;
}

function buildQueue(p: CharacterProfile): QueueRec[] {
  const job = getJob(p.job);
  const recs: QueueRec[] = [];
  const highest = highestDungeonForLevel(p.level);

  if (job.isLimited) {
    recs.push({
      title: "Blue Mage is a Limited Job",
      detail:
        "Blue Mage can't queue normal roulettes for leveling. Use the Masked Carnivale, spell farming, and synced parties instead. Treat the rest of this app as ‘for your normal jobs’.",
      priority: "PRIMARY",
      unlocked: true,
      icon: "🔵",
    });
    return recs;
  }

  if (p.level >= 100) {
    recs.push({
      title: "Expert Roulette + daily roulettes",
      detail:
        "At max level, run Expert Roulette and your daily roulettes for the current Tomestones — that's how you gear up at 100.",
      priority: "PRIMARY",
      unlocked: true,
      icon: "🏆",
    });
    recs.push({
      title: "Alliance Raid & Trial roulettes",
      detail: "Quick daily tomestone + gil income with low effort.",
      priority: "SECONDARY",
      unlocked: true,
      icon: "🎲",
    });
    return recs;
  }

  // --- Leveling path ---
  if (levelingRouletteUnlocked(p)) {
    recs.push({
      title: "Daily Leveling Roulette (do this first)",
      detail:
        "The single best EXP you'll get all day. One run, big bonus. Always clear this before grinding anything else.",
      priority: "PRIMARY",
      unlocked: true,
      icon: "⭐",
    });
  } else {
    recs.push({
      title: "Run a low-level dungeon to unlock Leveling Roulette",
      detail:
        "Queue Sastasha (15) once to open the Duty Roulette: Leveling — then it becomes your daily priority.",
      priority: "PRIMARY",
      unlocked: false,
      icon: "🔓",
    });
  }

  if (highest) {
    const next = nextDungeonAfter(p.level);
    recs.push({
      title: `Spam ${highest.name} for EXP`,
      detail: next
        ? `Best leveling dungeon you can run right now. Keep going until ${next.level}, then switch to ${next.name}.`
        : "Your best leveling dungeon right now — keep running it.",
      priority: "SECONDARY",
      unlocked: true,
      icon: "🗝️",
    });
  }

  // Roulettes that help while leveling
  if (p.msqStatus === "NORMAL") {
    recs.push({
      title: "Main Scenario / MSQ Roulette",
      detail:
        "If you're progressing normally, MSQ duties + the MSQ Roulette give great EXP. Story-skippers can ignore this.",
      priority: "SECONDARY",
      unlocked: true,
      icon: "📜",
    });
  }

  if (p.level >= 60) {
    recs.push({
      title: "Wondrous Tails (weekly)",
      detail:
        "Pick up the journal from Khloe in Idyllshire. Filling lines gives a fat EXP book reward — easy weekly boost.",
      priority: "OPTIONAL",
      unlocked: true,
      icon: "📔",
    });
  }

  recs.push({
    title: "Allied Society / Tribe dailies",
    detail:
      "If you have a tribe near your level unlocked, the daily quests are a calm EXP top-up between queues.",
    priority: "OPTIONAL",
    unlocked: true,
    icon: "🤝",
  });

  // Playstyle nuance
  if (p.playstyle === "SAFE_PRACTICE" && (job.role === "TANK" || job.role === "HEALER")) {
    recs.push({
      title: "Practice tip for new tanks/healers",
      detail:
        "Re-run a dungeon you already know at-level before roulette so you learn your kit in a safe, predictable place first.",
      priority: "OPTIONAL",
      unlocked: true,
      icon: "🧪",
    });
  }
  if (p.playstyle === "DPS_OPTIMIZE" && job.role.includes("RANGED") || (p.playstyle === "DPS_OPTIMIZE" && job.role === "MELEE")) {
    recs.push({
      title: "DPS queue tip",
      detail:
        "DPS queues are longest. Always have Leveling Roulette + a dungeon queued together, and keep your EXP food up while you wait.",
      priority: "OPTIONAL",
      unlocked: true,
      icon: "⏱️",
    });
  }

  return recs;
}

function buildRoute(p: CharacterProfile): RouteStep[] {
  if (getJob(p.job).isLimited || p.level >= 100) return [];
  const b = bracketForLevel(p.level);
  const until = Math.min(100, b.max === p.level ? p.level + 9 : b.max);
  const steps: RouteStep[] = LEVELING_DUNGEONS.filter(
    (d) => d.level >= Math.max(15, p.level - 1) && d.level <= until + 1
  )
    .slice(0, 6)
    .map((d) => ({
      level: d.level,
      name: d.name,
      type: "DUNGEON" as const,
      done: d.level < p.level,
      note: d.level <= p.level ? "Available now" : `Unlocks at ${d.level}`,
    }));
  return steps;
}

function buildGilWarnings(p: CharacterProfile): GilWarning[] {
  const b = bracketForLevel(p.level);
  const warnings: GilWarning[] = [];

  if (b.strategy === "POETICS_CAP") {
    warnings.push({
      title: "Don't buy gear here — use Poetics",
      detail: `At level ${p.level} the ${b.poeticsSet} set from Tomestones of Poetics beats most Market Board gear and costs zero gil.`,
      severity: "WARN",
    });
  }

  if (b.strategy === "MARKET_DUNGEON") {
    warnings.push({
      title: "Don't kit out every slot from the Market Board",
      detail:
        "While leveling, dungeon drops fill most slots for free. Buy a cheap HQ piece only where you're clearly behind, then move on.",
      severity: "WARN",
    });
  }

  if (b.strategy === "VENDOR_DUNGEON") {
    warnings.push({
      title: "Spend almost nothing before 50",
      detail:
        "Vendor gear, class-quest rewards and dungeon drops carry you to 50. Gil spent on gear here is wasted.",
      severity: "INFO",
    });
  }

  warnings.push({
    title: "Goblin tax warning 👺",
    detail:
      "If a leveling piece costs more than a fast dungeon run is worth, it's overpriced. Replace-soon gear isn't worth a premium.",
    severity: "INFO",
  });

  if (p.gil >= 10_000_000) {
    warnings.push({
      title: "You're rich — but gear is still a trap",
      detail:
        "With this much gil you can buy anything, yet leveling gear is replaced in minutes. Spend on glamour, mounts and housing instead.",
      severity: "INFO",
    });
  } else if (p.gil > 0 && p.gil < 50_000) {
    warnings.push({
      title: "Tight on gil — play it safe",
      detail:
        "Stick to dungeon drops and cheap EXP food. Don't touch the Market Board for leveling gear right now.",
      severity: "DANGER",
    });
  }

  return warnings;
}

function buildLuxury(p: CharacterProfile): LuxuryRec[] {
  const recs: LuxuryRec[] = [];
  if (p.goal === "MOUNT_SHOPPING" || p.gil >= 1_000_000) {
    recs.push({
      title: "Market Board mounts",
      detail:
        "Crafted & event mounts are often resold on the MB. Cross-world shop your DC for the best price before buying.",
      tag: "MOUNT",
    });
  }
  if (p.goal === "GLAMOUR" || p.gil >= 500_000) {
    recs.push({
      title: "Glamour & dyes",
      detail:
        "Old high-level gear makes the best glam and is cheap once out of date. Grab dyes on the MB to finish the look.",
      tag: "GLAM",
    });
  }
  recs.push({
    title: "Minions & orchestrion rolls",
    detail: "Cozy collectibles that won't break the bank — pure vibes.",
    tag: "FLEX",
  });
  if (p.gil >= 50_000_000) {
    recs.push({
      title: "Luxury flex 💎",
      detail:
        "At 50M+ gil, treat yourself: a housing plot's worth of furnishings, a rare mount, or a full glam wardrobe.",
      tag: "FLEX",
    });
  }
  return recs;
}

function buildStoryNote(p: CharacterProfile): string | undefined {
  const { ahead, gate } = storyAheadOfLevel(p);
  if (isStorySkipped(p) && ahead && gate) {
    return `Your story is ahead of your job level. You've unlocked content up to here, but this job is only ${p.level}. Level this job to ${gate} first — then continue the story. Recommendations below are filtered to what your job can actually do now.`;
  }
  if (isStorySkipped(p) && !ahead) {
    return `You used a story skip and your job is keeping up (level ${p.level}). You're clear to continue — focus on roulettes and the highest leveling dungeon to stay ahead.`;
  }
  return undefined;
}

function buildWhatNext(p: CharacterProfile): AdvisorResult["whatNext"] {
  const job = getJob(p.job);
  const highest = highestDungeonForLevel(p.level);
  const b = bracketForLevel(p.level);
  const { ahead, gate } = storyAheadOfLevel(p);
  const tier = resolveExperience(p);

  if (job.isLimited) {
    return {
      headline: "Hit the Masked Carnivale",
      action: "Blue Mage levels through the Carnivale & spell farming, not roulettes.",
      sub: "Use a normal job for everyday gearing advice.",
    };
  }

  if (ahead && gate) {
    return {
      headline: `Level ${job.name} to ${gate} first`,
      action: `Queue Daily Leveling Roulette, then spam ${highest?.name ?? "your best leveling dungeon"}.`,
      sub: `Your story is ahead of your level — close the ${gate - p.level}-level gap before continuing.`,
    };
  }

  if (tier === "ENDGAME") {
    return {
      headline: "Push the current tier",
      action:
        "Cap your weekly tomestones, clear the latest Savage/Extreme, and chip away at your relic between lockouts.",
      sub: "See the Endgame tab for the full max-level loop, gearing path and weekly targets.",
    };
  }

  if (p.level >= 100) {
    return {
      headline: "Run Expert + daily roulettes",
      action: "Grind current Tomestones and dungeon/raid drops to gear up at 100.",
      sub: "You're at max level — switch from leveling to endgame gearing. Mark yourself ‘Endgame’ for raid/relic guidance.",
    };
  }

  if (b.strategy === "POETICS_CAP") {
    return {
      headline: `Cap, then grab the ${b.poeticsSet} set`,
      action: `Do Daily Leveling Roulette, then buy ${b.poeticsSet} gear with Poetics before pushing on.`,
      sub: `Level ${p.level} is a gearing checkpoint — re-gear cheaply with tomestones here.`,
    };
  }

  // Goal-aware default
  switch (p.goal) {
    case "GIL_SAVING":
      return {
        headline: "Save your gil — level for free",
        action: `Queue Daily Leveling Roulette, then ${highest?.name ?? "your best dungeon"}. Skip the Market Board entirely.`,
        sub: "Dungeon drops + cheap food cost nothing and keep you current.",
      };
    case "GEAR_UPGRADE":
      return {
        headline: "Top up your weak slots, cheaply",
        action: "Check the Gear tab below — buy only the cheap HQ pieces flagged ‘Buy’, take dungeon drops for the rest.",
        sub: "Don't overspend on gear you'll replace in a few levels.",
      };
    default:
      return {
        headline: "Do your Daily Leveling Roulette",
        action: `Then spam ${highest?.name ?? "your highest leveling dungeon"} with EXP food up.`,
        sub: "Roulette first, dungeon second, food always — that's the fast lane.",
      };
  }
}

/** The full non-gear advisor result for a profile. */
export function buildAdvice(p: CharacterProfile): AdvisorResult {
  const job = getJob(p.job);
  const b = bracketForLevel(p.level);
  const estIl = p.avgItemLevel ?? estimateItemLevel(p.level);

  return {
    role: job.role,
    bracketLabel: b.label,
    experienceTier: resolveExperience(p),
    estimatedItemLevel: estIl,
    whatNext: buildWhatNext(p),
    gear: [], // filled by the gear API route (needs network)
    queue: buildQueue(p),
    route: buildRoute(p),
    food: foodAdvice(p.level),
    gilWarnings: buildGilWarnings(p),
    luxury: buildLuxury(p),
    storyNote: buildStoryNote(p),
  };
}

export { ROLE_LABEL };
